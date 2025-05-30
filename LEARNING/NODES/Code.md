# Code Node - Implementation Patterns

## Key Learning Points

### 1. Multi-Language Support
```typescript
{
  displayName: 'Language',
  name: 'language',
  type: 'options',
  displayOptions: { show: { '@version': [2] } },
  options: [
    { name: 'JavaScript', value: 'javaScript' },
    { name: 'Python (Beta)', value: 'python' },
  ],
  default: 'javaScript',
},
{
  displayName: 'Language',
  name: 'language',
  type: 'hidden',
  displayOptions: { show: { '@version': [1] } },
  default: 'javaScript',
}
```
- Version-specific language support
- Hidden field for backward compatibility
- Beta feature labeling for new languages

### 2. Execution Mode Selection
```typescript
{
  displayName: 'Mode',
  name: 'mode',
  type: 'options',
  options: [
    {
      name: 'Run Once for All Items',
      value: 'runOnceForAllItems',
      description: 'Run this code only once, no matter how many input items there are',
    },
    {
      name: 'Run Once for Each Item',
      value: 'runOnceForEachItem',
      description: 'Run this code as many times as there are input items',
    },
  ],
  default: 'runOnceForAllItems',
}
```
- Clear execution mode distinction
- Descriptive explanations for each mode
- Performance implications clearly communicated

### 3. Task Runner Integration
```typescript
async execute(this: IExecuteFunctions) {
  const runnersConfig = Container.get(TaskRunnersConfig);
  
  if (runnersConfig.enabled && language === 'javaScript') {
    const sandbox = new JsTaskRunnerSandbox(code, nodeMode, workflowMode, this);
    const numInputItems = this.getInputData().length;

    return nodeMode === 'runOnceForAllItems'
      ? [await sandbox.runCodeAllItems()]
      : [await sandbox.runCodeForEachItem(numInputItems)];
  }
}
```
- Conditional task runner usage based on configuration
- Separate sandbox implementations for different execution environments
- Performance optimization through external task runners

### 4. Sandbox Architecture
```typescript
export abstract class Sandbox extends EventEmitter {
  abstract runCode<T = unknown>(): Promise<T>;
  abstract runCodeAllItems(): Promise<INodeExecutionData[] | INodeExecutionData[][]>;
  abstract runCodeEachItem(itemIndex: number): Promise<INodeExecutionData | undefined>;
}

export class JavaScriptSandbox extends Sandbox {
  private readonly vm: NodeVM;

  constructor(context: SandboxContext, private jsCode: string, helpers: IExecuteFunctions['helpers']) {
    this.vm = new NodeVM({
      console: 'redirect',
      sandbox: context,
      require: vmResolver,
      wasm: false,
    });
  }
}
```
- Abstract base class for different language sandboxes
- VM2 integration for secure JavaScript execution
- Event-driven architecture for output handling

### 5. Context Preparation
```typescript
export function getSandboxContext(
  this: IExecuteFunctions | ISupplyDataFunctions,
  index: number,
): SandboxContext {
  const helpers = {
    ...this.helpers,
    httpRequestWithAuthentication: this.helpers.httpRequestWithAuthentication.bind(this),
    requestWithAuthenticationPaginated: this.helpers.requestWithAuthenticationPaginated.bind(this),
  };
  
  return {
    $getNodeParameter: this.getNodeParameter.bind(this),
    $getWorkflowStaticData: this.getWorkflowStaticData.bind(this),
    helpers,
    ...this.getWorkflowDataProxy(index),
  };
}
```
- Comprehensive context with n8n APIs
- Proper method binding for context preservation
- Workflow data proxy integration

### 6. Execution Mode Handling
```typescript
const getSandbox = (index = 0) => {
  const context = getSandboxContext.call(this, index);
  if (nodeMode === 'runOnceForAllItems') {
    context.items = context.$input.all();
  } else {
    context.item = context.$input.item;
  }
  return new Sandbox(context, code, this.helpers);
};

if (nodeMode === 'runOnceForAllItems') {
  const sandbox = getSandbox();
  items = await sandbox.runCodeAllItems();
} else {
  for (let index = 0; index < inputDataItems.length; index++) {
    const sandbox = getSandbox(index);
    result = await sandbox.runCodeEachItem(index);
  }
}
```
- Different context setup for each execution mode
- Per-item sandbox creation for isolation
- Mode-specific data access patterns

### 7. Output Validation
```typescript
validateRunCodeEachItem(executionResult: INodeExecutionData | undefined, itemIndex: number): INodeExecutionData {
  if (typeof executionResult !== 'object') {
    throw new ValidationError({
      message: `Code doesn't return an object`,
      description: `Please return an object representing the output item.`,
      itemIndex,
    });
  }

  if (Array.isArray(executionResult)) {
    throw new ValidationError({
      message: `Code doesn't return a single object`,
      description: `If you need to output multiple items, please use the 'Run Once for All Items' mode instead.`,
      itemIndex,
    });
  }

  const [returnData] = this.helpers.normalizeItems([executionResult]);
  this.validateItem(returnData, itemIndex);
  this.validateTopLevelKeys(returnData, itemIndex);
  return returnData;
}
```
- Comprehensive output validation
- Mode-specific validation rules
- Helpful error messages with suggestions

### 8. Top-Level Key Validation
```typescript
export const REQUIRED_N8N_ITEM_KEYS = new Set([
  'json',
  'binary',
  'pairedItem',
  'error',
  'index', // Legacy support
]);

private validateTopLevelKeys(item: INodeExecutionData, itemIndex: number) {
  Object.keys(item).forEach((key) => {
    if (REQUIRED_N8N_ITEM_KEYS.has(key)) return;
    throw new ValidationError({
      message: `Unknown top-level item key: ${key}`,
      description: 'Access the properties of an item under `.json`, e.g. `item.json`',
      itemIndex,
    });
  });
}
```
- Strict validation of item structure
- Legacy key support for backward compatibility
- Clear guidance on proper item structure

### 9. Console Output Handling
```typescript
const sandbox = new JavaScriptSandbox(context, code, helpers);
sandbox.on(
  'output',
  workflowMode === 'manual'
    ? this.sendMessageToUI.bind(this)
    : CODE_ENABLE_STDOUT === 'true'
      ? (...args) => console.log(`[Workflow "${this.getWorkflow().id}"][Node "${node.name}"]`, ...args)
      : () => {},
);
```
- Mode-specific console output handling
- UI integration for manual execution
- Environment variable control for production logging

### 10. Error Handling and Recovery
```typescript
try {
  items = await sandbox.runCodeAllItems();
} catch (error) {
  if (!this.continueOnFail()) {
    set(error, 'node', node);
    throw error;
  }
  items = [{ json: { error: error.message } }];
}

// Per-item error handling
try {
  result = await sandbox.runCodeEachItem(index);
} catch (error) {
  if (!this.continueOnFail()) {
    set(error, 'node', node);
    throw error;
  }
  returnData.push({
    json: { error: error.message },
    pairedItem: { item: index },
  });
}
```
- Continue-on-fail support
- Error context preservation
- Graceful error item creation

### 11. Module Resolution
```typescript
const { NODE_FUNCTION_ALLOW_BUILTIN: builtIn, NODE_FUNCTION_ALLOW_EXTERNAL: external } = process.env;

export const vmResolver = makeResolverFromLegacyOptions({
  external: external
    ? {
        modules: external.split(','),
        transitive: false,
      }
    : false,
  builtin: builtIn?.split(',') ?? [],
});
```
- Environment-controlled module access
- Security through allowlist approach
- Configurable built-in and external module support

### 12. Implementation Patterns
- **Multi-Language Support**: Abstract sandbox architecture for different languages
- **Execution Modes**: Different contexts and validation for batch vs per-item execution
- **Security**: VM2 sandboxing with controlled module access
- **Validation**: Comprehensive output validation with helpful error messages
- **Performance**: Task runner integration for improved execution
- **Context Management**: Rich context with n8n APIs and workflow data

### 13. Reusable Patterns
- Use abstract base classes for multi-language support
- Implement mode-specific execution with different contexts
- Provide comprehensive output validation with clear error messages
- Use event-driven architecture for console output handling
- Implement continue-on-fail with proper error item creation
- Use environment variables for security configuration
- Validate item structure strictly with helpful guidance
- Support both synchronous and asynchronous code execution
- Provide rich context with bound n8n APIs
- Use task runners for performance optimization when available
