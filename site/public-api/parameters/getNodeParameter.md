# getNodeParameter

Gets a parameter value configured by the user in the node's UI. This is the primary method for accessing user-configured settings in your node.

## Signature

```ts
getNodeParameter(
  parameterName: string,
  itemIndex: number,
  fallbackValue?: any,
  options?: IGetNodeParameterOptions
): NodeParameterValueType | object
```

## Parameters

- **`parameterName`** - Name of the parameter as defined in the node description
- **`itemIndex`** - Index of the current item being processed (usually the loop index)
- **`fallbackValue`** - Default value if parameter is not set or is undefined
- **`options`** - Additional options for parameter retrieval

## Return Types

The return type depends on the parameter type defined in your node description:

```ts
type NodeParameterValueType = 
  | string 
  | number 
  | boolean 
  | undefined 
  | null;
```

For complex parameters (objects, collections), the return type is `object`.

## Basic Usage

### String Parameters
```ts
const operation = this.getNodeParameter('operation', 0) as string;
const apiUrl = this.getNodeParameter('apiUrl', i) as string;
const message = this.getNodeParameter('message', i, 'Default message') as string;
```

### Number Parameters
```ts
const limit = this.getNodeParameter('limit', i) as number;
const timeout = this.getNodeParameter('timeout', i, 30000) as number;
const retries = this.getNodeParameter('retries', i, 3) as number;
```

### Boolean Parameters
```ts
const returnAll = this.getNodeParameter('returnAll', i) as boolean;
const includeMetadata = this.getNodeParameter('includeMetadata', i, false) as boolean;
const skipErrors = this.getNodeParameter('skipErrors', i) as boolean;
```

### Object Parameters
```ts
// For additionalFields, filters, etc.
const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
const options = this.getNodeParameter('options', i, {}) as IDataObject;
```

## Advanced Usage

### Collections
```ts
// For collection parameters
interface EmailRecipient {
  email: string;
  name?: string;
  type: 'to' | 'cc' | 'bcc';
}

const recipients = this.getNodeParameter('recipients', i, []) as EmailRecipient[];

for (const recipient of recipients) {
  console.log(`Sending to: ${recipient.email} (${recipient.type})`);
}
```

### Nested Objects
```ts
// For complex nested structures
interface ApiConfig {
  endpoint: string;
  authentication: {
    type: 'apiKey' | 'oauth';
    credentials: IDataObject;
  };
  options: {
    timeout: number;
    retries: number;
  };
}

const config = this.getNodeParameter('apiConfig', i) as ApiConfig;
const endpoint = config.endpoint;
const authType = config.authentication.type;
const timeout = config.options.timeout;
```

### Dynamic Parameters
```ts
// Parameters that depend on other parameters
const resource = this.getNodeParameter('resource', i) as string;

if (resource === 'user') {
  const userId = this.getNodeParameter('userId', i) as string;
  const includeProfile = this.getNodeParameter('includeProfile', i, false) as boolean;
} else if (resource === 'post') {
  const postId = this.getNodeParameter('postId', i) as string;
  const includeComments = this.getNodeParameter('includeComments', i, false) as boolean;
}
```

## Type Safety

### Using Type Assertions
```ts
// Basic type assertions
const operation = this.getNodeParameter('operation', i) as string;
const limit = this.getNodeParameter('limit', i) as number;
const enabled = this.getNodeParameter('enabled', i) as boolean;
```

### Using Interfaces
```ts
interface NodeParameters {
  operation: string;
  resource: string;
  limit?: number;
  additionalFields?: {
    includeMetadata?: boolean;
    format?: 'json' | 'xml';
    timeout?: number;
  };
}

// Type-safe parameter access
const operation = this.getNodeParameter('operation', i) as NodeParameters['operation'];
const additionalFields = this.getNodeParameter('additionalFields', i, {}) as NodeParameters['additionalFields'];

if (additionalFields?.includeMetadata) {
  // TypeScript knows this is a boolean
}
```

### Generic Helper Function
```ts
function getTypedParameter<T>(
  this: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
  fallbackValue?: T
): T {
  return this.getNodeParameter(parameterName, itemIndex, fallbackValue) as T;
}

// Usage
const limit = getTypedParameter<number>('limit', i, 100);
const options = getTypedParameter<IDataObject>('options', i, {});
```

## Parameter Options

### `IGetNodeParameterOptions`
```ts
interface IGetNodeParameterOptions {
  extractValue?: boolean;
  rawExpressions?: boolean;
}
```

#### Extract Value
```ts
// Get the raw parameter value without expression evaluation
const rawValue = this.getNodeParameter('expression', i, '', { 
  extractValue: false 
});

// Get the evaluated expression result
const evaluatedValue = this.getNodeParameter('expression', i, '', { 
  extractValue: true 
});
```

#### Raw Expressions
```ts
// Get expressions as strings without evaluation
const expression = this.getNodeParameter('dynamicValue', i, '', { 
  rawExpressions: true 
});
console.log(expression); // "={{ $json.name }}"

// Get evaluated expression result (default behavior)
const value = this.getNodeParameter('dynamicValue', i);
console.log(value); // "John Doe"
```

## Common Patterns

### Resource and Operation Pattern
```ts
const resource = this.getNodeParameter('resource', 0) as string;
const operation = this.getNodeParameter('operation', 0) as string;

if (resource === 'user') {
  if (operation === 'get') {
    const userId = this.getNodeParameter('userId', i) as string;
    // Get user logic
  } else if (operation === 'create') {
    const userData = this.getNodeParameter('userData', i) as IDataObject;
    // Create user logic
  }
}
```

### Conditional Parameters
```ts
const returnAll = this.getNodeParameter('returnAll', i) as boolean;
let limit: number | undefined;

if (!returnAll) {
  limit = this.getNodeParameter('limit', i, 50) as number;
}
```

### Additional Fields Pattern
```ts
const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

// Build request body with base fields + additional fields
const requestBody: IDataObject = {
  name: this.getNodeParameter('name', i) as string,
  email: this.getNodeParameter('email', i) as string,
  ...additionalFields, // Spread additional fields
};

// Or access specific additional fields
if (additionalFields.phone) {
  requestBody.phone = additionalFields.phone;
}
if (additionalFields.company) {
  requestBody.company = additionalFields.company;
}
```

### Filters Pattern
```ts
interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'greaterThan';
  value: string | number;
}

const filters = this.getNodeParameter('filters', i, {}) as {
  conditions?: FilterCondition[];
  combineWith?: 'AND' | 'OR';
};

if (filters.conditions && filters.conditions.length > 0) {
  // Apply filters to query
  const queryFilters = filters.conditions.map(condition => {
    return `${condition.field} ${condition.operator} ${condition.value}`;
  });
  
  const filterString = queryFilters.join(` ${filters.combineWith || 'AND'} `);
}
```

## Error Handling

### Required Parameters
```ts
const apiKey = this.getNodeParameter('apiKey', i) as string;
if (!apiKey) {
  throw new NodeOperationError(
    this.getNode(),
    'API Key is required',
    { itemIndex: i }
  );
}
```

### Parameter Validation
```ts
const limit = this.getNodeParameter('limit', i, 100) as number;
if (limit < 1 || limit > 1000) {
  throw new NodeOperationError(
    this.getNode(),
    'Limit must be between 1 and 1000',
    { itemIndex: i }
  );
}
```

### Safe Parameter Access
```ts
function safeGetParameter<T>(
  this: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
  fallbackValue: T,
  validator?: (value: T) => boolean
): T {
  try {
    const value = this.getNodeParameter(parameterName, itemIndex, fallbackValue) as T;
    
    if (validator && !validator(value)) {
      throw new Error(`Invalid value for parameter ${parameterName}`);
    }
    
    return value;
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `Error getting parameter ${parameterName}: ${error.message}`,
      { itemIndex }
    );
  }
}

// Usage
const limit = safeGetParameter(
  'limit',
  i,
  100,
  (value: number) => value > 0 && value <= 1000
);
```

## Performance Considerations

### Cache Parameter Values
```ts
// ❌ Bad - Getting the same parameter multiple times
for (let i = 0; i < items.length; i++) {
  const apiUrl = this.getNodeParameter('apiUrl', i) as string; // Same for all items
  const timeout = this.getNodeParameter('timeout', i) as number; // Same for all items
  // Process item
}

// ✅ Good - Cache parameters that don't change per item
const apiUrl = this.getNodeParameter('apiUrl', 0) as string;
const timeout = this.getNodeParameter('timeout', 0) as number;

for (let i = 0; i < items.length; i++) {
  const itemSpecificParam = this.getNodeParameter('itemParam', i) as string;
  // Process item
}
```

### Batch Parameter Access
```ts
// For parameters that might be expensive to evaluate
const batchSize = 100;
const cachedParams = new Map<string, any>();

function getCachedParameter(paramName: string, itemIndex: number, fallback?: any) {
  const key = `${paramName}_${itemIndex}`;
  if (!cachedParams.has(key)) {
    cachedParams.set(key, this.getNodeParameter(paramName, itemIndex, fallback));
  }
  return cachedParams.get(key);
}
```

## Best Practices

### 1. Use Descriptive Parameter Names
```ts
// ✅ Good
const maxRetries = this.getNodeParameter('maxRetries', i, 3) as number;
const includeMetadata = this.getNodeParameter('includeMetadata', i, false) as boolean;

// ❌ Bad
const max = this.getNodeParameter('max', i, 3) as number;
const flag = this.getNodeParameter('flag', i, false) as boolean;
```

### 2. Provide Sensible Defaults
```ts
// ✅ Good - Provide reasonable defaults
const timeout = this.getNodeParameter('timeout', i, 30000) as number;
const retries = this.getNodeParameter('retries', i, 3) as number;
const batchSize = this.getNodeParameter('batchSize', i, 100) as number;
```

### 3. Validate Parameter Values
```ts
// ✅ Good - Validate critical parameters
const limit = this.getNodeParameter('limit', i, 100) as number;
if (limit < 1) {
  throw new NodeOperationError(this.getNode(), 'Limit must be at least 1');
}

const email = this.getNodeParameter('email', i) as string;
if (!email.includes('@')) {
  throw new NodeOperationError(this.getNode(), 'Invalid email format');
}
```

### 4. Use Type-Safe Interfaces
```ts
// ✅ Good - Define interfaces for complex parameters
interface EmailConfig {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

const emailConfig = this.getNodeParameter('emailConfig', i) as EmailConfig;
```

## See Also

- **[IExecuteFunctions](../execution-contexts/IExecuteFunctions)** - Main execution context
- **[evaluateExpression](./evaluateExpression)** - Evaluating n8n expressions
- **[getCurrentNodeParameter](./getCurrentNodeParameter)** - Getting current parameter values
- **[Error Handling](../../advanced/ErrorHandling)** - Robust error management
