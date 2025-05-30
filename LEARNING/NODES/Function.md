# Function Node - Implementation Patterns

## Key Learning Points

### 1. Deprecated Node Pattern
```typescript
description: INodeTypeDescription = {
  hidden: true,  // Hides from node palette
  properties: [
    {
      displayName: 'A newer version of this node type is available, called the 'Code' node',
      name: 'notice',
      type: 'notice',
      default: '',
    }
  ]
}
```
- Shows how to deprecate nodes while keeping them functional
- Uses `hidden: true` to hide from new workflows

### 2. Code Editor Configuration
```typescript
{
  displayName: 'JavaScript Code',
  name: 'functionCode',
  typeOptions: {
    alwaysOpenEditWindow: true,
    codeAutocomplete: 'function',
    editor: 'jsEditor',
    rows: 10,
  },
  type: 'string',
  noDataExpression: true,
}
```
- `alwaysOpenEditWindow`: Forces modal editor for code
- `codeAutocomplete`: Enables function-specific autocomplete
- `editor: 'jsEditor'`: Uses JavaScript syntax highlighting
- `noDataExpression`: Prevents n8n expression evaluation

### 3. VM Sandboxing
```typescript
import { NodeVM } from '@n8n/vm2';

const options: NodeVMOptions = {
  console: mode === 'manual' ? 'redirect' : 'inherit',
  sandbox,
  require: vmResolver,
};

const vm = new NodeVM(options);
```
- Uses VM2 for secure code execution
- Different console handling for manual vs automatic execution
- Custom require resolver for allowed modules

### 4. Sandbox Environment
```typescript
const sandbox = {
  getNodeParameter: this.getNodeParameter.bind(this),
  getWorkflowStaticData: this.getWorkflowStaticData.bind(this),
  helpers: this.helpers,
  items,
  $item: (index: number) => this.getWorkflowDataProxy(index),
  getBinaryDataAsync: async (item: INodeExecutionData): Promise<IBinaryKeyData | undefined> => { ... },
  setBinaryDataAsync: async (item: INodeExecutionData, data: IBinaryKeyData) => { ... },
};

// Make workflow data accessible
Object.assign(sandbox, sandbox.$item(0));
```
- Exposes n8n APIs to user code
- Provides binary data helpers
- Makes workflow data accessible via `$item()`

### 5. Data Deep Copying
```typescript
let items = this.getInputData();
items = deepCopy(items);

// Assign item indexes
for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
  items[itemIndex].index = itemIndex;
}
```
- Deep copies input to prevent mutation
- Adds index property for reference

### 6. Code Execution Pattern
```typescript
const functionCode = this.getNodeParameter('functionCode', 0) as string;

items = await vm.run(`module.exports = async function() {${functionCode}\n}()`, __dirname);
```
- Wraps user code in async function
- Uses module.exports pattern for return value

### 7. Console Redirection
```typescript
if (mode === 'manual') {
  vm.on('console.log', this.sendMessageToUI.bind(this));
}
```
- Redirects console.log to UI in manual mode
- Allows debugging output to appear in editor

### 8. Data Validation
```typescript
if (items === undefined) {
  throw new NodeOperationError(this.getNode(), 'No data got returned. Always return an Array of items!');
}
if (!Array.isArray(items)) {
  throw new NodeOperationError(this.getNode(), 'Always an Array of items has to be returned!');
}
for (const item of items) {
  if (item.json === undefined) {
    throw new NodeOperationError(this.getNode(), 'All returned items have to contain a property named "json"!');
  }
}
```
- Validates return data structure
- Provides helpful error messages

### 9. Data Cleanup
```typescript
const cleanupData = (inputData: IDataObject): IDataObject => {
  Object.keys(inputData).map((key) => {
    if (inputData[key] !== null && typeof inputData[key] === 'object') {
      if (inputData[key].constructor.name === 'Object') {
        inputData[key] = cleanupData(inputData[key] as IDataObject);
      } else {
        inputData[key] = deepCopy(inputData[key]);
      }
    }
  });
  return inputData;
};
```
- Recursively cleans object data
- Handles special objects like Date

### 10. Error Handling with Line Numbers
```typescript
const stackLines = error.stack.split('\n');
if (stackLines.length > 0) {
  stackLines.shift();
  const lineParts = stackLines.find((line: string) => line.includes('Function')).split(':');
  if (lineParts.length > 2) {
    const lineNumber = lineParts.splice(-2, 1);
    if (!isNaN(lineNumber as number)) {
      error.message = `${error.message} [Line ${lineNumber}]`;
    }
  }
}
```
- Extracts line numbers from stack traces
- Provides better debugging information

### 11. Implementation Patterns
- **Code Execution**: Use VM2 for secure sandboxing
- **API Exposure**: Bind n8n functions to sandbox
- **Data Safety**: Deep copy input data
- **Validation**: Validate return data structure
- **Debugging**: Redirect console output in manual mode
- **Error Enhancement**: Add line numbers to errors

### 12. Reusable Patterns
- Use `hidden: true` for deprecated nodes
- Configure code editors with appropriate typeOptions
- Implement secure sandboxing with VM2
- Provide helpful APIs in sandbox environment
- Validate user-returned data thoroughly
- Enhance error messages with context
- Handle different execution modes appropriately
