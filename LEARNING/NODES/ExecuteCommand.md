# ExecuteCommand Node - Implementation Patterns

## Key Learning Points

### 1. Simple Node Structure
```typescript
export class ExecuteCommand implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Execute Command',
    name: 'executeCommand',
    icon: 'fa:terminal',
    iconColor: 'crimson',
    group: ['transform'],
    version: 1,
    description: 'Executes a command on the host',
    usableAsTool: true,
  };
}
```
- Minimal node structure for focused functionality
- Clear iconography (terminal icon with crimson color)
- Tool-enabled for AI agent usage
- Single version implementation

### 2. Execute Once Pattern
```typescript
{
  displayName: 'Execute Once',
  name: 'executeOnce',
  type: 'boolean',
  default: true,
  description: 'Whether to execute only once instead of once for each entry',
}

// Usage in execution
const executeOnce = this.getNodeParameter('executeOnce', 0) as boolean;
if (executeOnce) {
  items = [items[0]];
}
```
- Performance optimization for batch operations
- User choice between single vs per-item execution
- Simple array manipulation to control execution

### 3. Custom Promise Wrapper
```typescript
interface IExecReturnData {
  exitCode: number;
  error?: Error;
  stderr: string;
  stdout: string;
}

async function execPromise(command: string): Promise<IExecReturnData> {
  const returnData: IExecReturnData = {
    error: undefined,
    exitCode: 0,
    stderr: '',
    stdout: '',
  };

  return await new Promise((resolve, _reject) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      returnData.stdout = stdout.trim();
      returnData.stderr = stderr.trim();
      
      if (error) {
        returnData.error = error;
      }
      
      resolve(returnData);
    }).on('exit', (code) => {
      returnData.exitCode = code || 0;
    });
  });
}
```
- Manual promisification for complete control
- Captures all execution details (stdout, stderr, exit code)
- Proper error handling without rejection
- Working directory set to process.cwd()

### 4. Comprehensive Output Structure
```typescript
returnItems.push({
  json: {
    exitCode,
    stderr,
    stdout,
  },
  pairedItem: {
    item: itemIndex,
  },
});
```
- Complete command execution information
- Exit code for success/failure detection
- Both stdout and stderr captured
- Proper item pairing for traceability

### 5. Multi-line Command Input
```typescript
{
  displayName: 'Command',
  name: 'command',
  typeOptions: {
    rows: 5,
  },
  type: 'string',
  default: '',
  placeholder: 'echo "test"',
  description: 'The command to execute',
  required: true,
}
```
- Multi-line text area for complex commands
- Clear placeholder example
- Required field validation
- Descriptive labeling

### 6. Error Handling Strategy
```typescript
try {
  const { error, exitCode, stdout, stderr } = await execPromise(command);
  
  if (error !== undefined) {
    throw new NodeOperationError(this.getNode(), error.message, { itemIndex });
  }
  
  // Success case
} catch (error) {
  if (this.continueOnFail()) {
    returnItems.push({
      json: {
        error: error.message,
      },
      pairedItem: {
        item: itemIndex,
      },
    });
    continue;
  }
  throw error;
}
```
- Two-level error handling (exec error + exception)
- Continue-on-fail support with error items
- Proper error context with item index
- NodeOperationError for n8n error handling

### 7. Per-Item Command Execution
```typescript
for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
  try {
    command = this.getNodeParameter('command', itemIndex) as string;
    const { error, exitCode, stdout, stderr } = await execPromise(command);
    // ... handle result
  } catch (error) {
    // ... handle error
  }
}
```
- Per-item parameter evaluation
- Individual error handling per command
- Sequential execution (not parallel)
- Item-specific command customization

### 8. Security Considerations
```typescript
// Note: This node executes commands directly on the host
exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
  // Direct command execution
});
```
- **Security Warning**: Direct command execution
- No input sanitization or validation
- Runs with n8n process permissions
- Working directory control

### 9. Output Data Trimming
```typescript
returnData.stdout = stdout.trim();
returnData.stderr = stderr.trim();
```
- Clean output by removing trailing whitespace
- Consistent data formatting
- Prevents unnecessary whitespace in results

### 10. Exit Code Handling
```typescript
}).on('exit', (code) => {
  returnData.exitCode = code || 0;
});
```
- Proper exit code capture
- Default to 0 if code is null/undefined
- Separate from error handling

### 11. Implementation Patterns
- **Simple Functionality**: Focused single-purpose node
- **Custom Promisification**: Manual promise wrapping for complete control
- **Comprehensive Output**: Capture all execution details
- **Execute Once Option**: Performance optimization for batch operations
- **Security Awareness**: Direct system access with inherent risks

### 12. Reusable Patterns
- Use custom promise wrappers when standard promisification is insufficient
- Provide "execute once" options for performance optimization
- Capture comprehensive execution information (stdout, stderr, exit code)
- Implement two-level error handling for external processes
- Use multi-line text areas for complex input
- Trim output data for clean results
- Handle null/undefined exit codes gracefully
- Provide continue-on-fail with error items
- Use proper working directory for command execution
- Consider security implications of direct system access

### 13. Security Best Practices (Not Implemented)
- **Input Validation**: Should validate/sanitize commands
- **Command Allowlisting**: Restrict allowed commands
- **Sandboxing**: Run commands in isolated environment
- **Permission Control**: Limit execution permissions
- **Audit Logging**: Log all executed commands

### 14. Use Cases
- System administration tasks
- File system operations
- External tool integration
- Batch processing scripts
- System monitoring commands
- Development workflow automation
