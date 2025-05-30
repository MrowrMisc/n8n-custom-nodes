---
title: getCurrentNodeParameter
description: Access parameters from the current node during execution
---

# getCurrentNodeParameter

The `getCurrentNodeParameter` function provides access to parameters of the current node during execution. This is useful for accessing node configuration values that may have been set dynamically or need to be retrieved in specific execution contexts.

## When to Use

Use `getCurrentNodeParameter` when your node needs to:
- Access its own parameter values during execution
- Retrieve dynamically set parameter values
- Get parameter values in contexts where `getNodeParameter` might not be available
- Access parameter metadata or additional information
- Implement parameter-dependent logic within the node

## Function Signature

```typescript
getCurrentNodeParameter(
  parameterName: string,
  fallbackValue?: any
): any
```

## Parameters

- **parameterName**: The name of the parameter to retrieve
- **fallbackValue**: Optional fallback value if parameter is not found

## Basic Usage

### Simple Parameter Access

```typescript
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Access current node parameters
  const apiUrl = this.getCurrentNodeParameter('apiUrl')
  const timeout = this.getCurrentNodeParameter('timeout', 30000)
  const enableLogging = this.getCurrentNodeParameter('enableLogging', false)
  
  const results = []
  
  for (const item of items) {
    if (enableLogging) {
      console.log(`Processing item with API URL: ${apiUrl}`)
    }
    
    // Use parameters in processing
    const result = await processWithConfig(item, {
      apiUrl,
      timeout,
      enableLogging
    })
    
    results.push(result)
  }
  
  return [results]
}
```

### Parameter Validation

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Validate required parameters
  const apiKey = this.getCurrentNodeParameter('apiKey')
  if (!apiKey) {
    throw new Error('API Key is required')
  }
  
  const endpoint = this.getCurrentNodeParameter('endpoint')
  if (!endpoint) {
    throw new Error('Endpoint URL is required')
  }
  
  // Validate parameter format
  const batchSize = this.getCurrentNodeParameter('batchSize', 10)
  if (batchSize < 1 || batchSize > 100) {
    throw new Error('Batch size must be between 1 and 100')
  }
  
  return [items]
}
```

## Advanced Usage

### Dynamic Parameter Access

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const operation = this.getCurrentNodeParameter('operation')
  
  // Access different parameters based on operation
  let config: any = {}
  
  switch (operation) {
    case 'create':
      config = {
        name: this.getCurrentNodeParameter('name'),
        description: this.getCurrentNodeParameter('description'),
        tags: this.getCurrentNodeParameter('tags', [])
      }
      break
      
    case 'update':
      config = {
        id: this.getCurrentNodeParameter('id'),
        fields: this.getCurrentNodeParameter('updateFields', {})
      }
      break
      
    case 'delete':
      config = {
        id: this.getCurrentNodeParameter('id'),
        force: this.getCurrentNodeParameter('force', false)
      }
      break
      
    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
  
  const results = []
  
  for (const item of items) {
    const result = await performOperation(operation, config, item)
    results.push(result)
  }
  
  return [results]
}
```

### Parameter-Based Configuration

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Build configuration from multiple parameters
  const config = {
    // Connection settings
    host: this.getCurrentNodeParameter('host'),
    port: this.getCurrentNodeParameter('port', 443),
    ssl: this.getCurrentNodeParameter('ssl', true),
    
    // Authentication
    authType: this.getCurrentNodeParameter('authType'),
    credentials: this.getCurrentNodeParameter('credentials'),
    
    // Processing options
    retries: this.getCurrentNodeParameter('retries', 3),
    timeout: this.getCurrentNodeParameter('timeout', 30000),
    batchSize: this.getCurrentNodeParameter('batchSize', 50),
    
    // Output options
    includeMetadata: this.getCurrentNodeParameter('includeMetadata', false),
    format: this.getCurrentNodeParameter('outputFormat', 'json')
  }
  
  // Validate configuration
  if (!config.host) {
    throw new Error('Host is required')
  }
  
  if (config.authType === 'credentials' && !config.credentials) {
    throw new Error('Credentials are required when using credential authentication')
  }
  
  return [items]
}
```

### Conditional Parameter Access

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Check if advanced options are enabled
  const useAdvancedOptions = this.getCurrentNodeParameter('useAdvancedOptions', false)
  
  let config: any = {
    // Basic configuration
    url: this.getCurrentNodeParameter('url'),
    method: this.getCurrentNodeParameter('method', 'GET')
  }
  
  if (useAdvancedOptions) {
    // Add advanced configuration
    config = {
      ...config,
      headers: this.getCurrentNodeParameter('headers', {}),
      queryParams: this.getCurrentNodeParameter('queryParams', {}),
      timeout: this.getCurrentNodeParameter('timeout', 30000),
      followRedirects: this.getCurrentNodeParameter('followRedirects', true),
      maxRedirects: this.getCurrentNodeParameter('maxRedirects', 5)
    }
  }
  
  return [items]
}
```

## Parameter Types and Handling

### String Parameters

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // String parameters with validation
  const name = this.getCurrentNodeParameter('name')
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Name must be a non-empty string')
  }
  
  const description = this.getCurrentNodeParameter('description', '')
  const category = this.getCurrentNodeParameter('category', 'default')
  
  return [items]
}
```

### Number Parameters

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Number parameters with validation
  const limit = this.getCurrentNodeParameter('limit', 100)
  if (typeof limit !== 'number' || limit < 1) {
    throw new Error('Limit must be a positive number')
  }
  
  const offset = this.getCurrentNodeParameter('offset', 0)
  if (typeof offset !== 'number' || offset < 0) {
    throw new Error('Offset must be a non-negative number')
  }
  
  return [items]
}
```

### Boolean Parameters

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Boolean parameters
  const includeDeleted = this.getCurrentNodeParameter('includeDeleted', false)
  const sortAscending = this.getCurrentNodeParameter('sortAscending', true)
  const enableCache = this.getCurrentNodeParameter('enableCache', false)
  
  const config = {
    includeDeleted: Boolean(includeDeleted),
    sortAscending: Boolean(sortAscending),
    enableCache: Boolean(enableCache)
  }
  
  return [items]
}
```

### Array Parameters

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Array parameters
  const fields = this.getCurrentNodeParameter('fields', [])
  if (!Array.isArray(fields)) {
    throw new Error('Fields must be an array')
  }
  
  const tags = this.getCurrentNodeParameter('tags', [])
  const filters = this.getCurrentNodeParameter('filters', [])
  
  return [items]
}
```

### Object Parameters

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Object parameters
  const headers = this.getCurrentNodeParameter('headers', {})
  if (typeof headers !== 'object' || headers === null) {
    throw new Error('Headers must be an object')
  }
  
  const metadata = this.getCurrentNodeParameter('metadata', {})
  const options = this.getCurrentNodeParameter('options', {})
  
  return [items]
}
```

## Error Handling

### Parameter Existence Checking

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  try {
    // Check if parameter exists
    const requiredParam = this.getCurrentNodeParameter('requiredParam')
    if (requiredParam === undefined || requiredParam === null) {
      throw new Error('Required parameter is missing')
    }
    
    // Optional parameter with fallback
    const optionalParam = this.getCurrentNodeParameter('optionalParam', 'default')
    
    return [items]
  } catch (error) {
    throw new Error(`Parameter access failed: ${error.message}`)
  }
}
```

### Type Safety

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Type-safe parameter access
  function getTypedParameter<T>(name: string, defaultValue: T, validator?: (value: any) => value is T): T {
    const value = this.getCurrentNodeParameter(name, defaultValue)
    
    if (validator && !validator(value)) {
      throw new Error(`Parameter ${name} has invalid type`)
    }
    
    return value
  }
  
  // Usage with type validation
  const timeout = getTypedParameter('timeout', 30000, (v): v is number => typeof v === 'number' && v > 0)
  const enabled = getTypedParameter('enabled', false, (v): v is boolean => typeof v === 'boolean')
  
  return [items]
}
```

## Common Patterns

### Configuration Builder

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Build configuration object from parameters
  const buildConfig = () => {
    const config: any = {}
    
    // Required parameters
    const requiredParams = ['apiUrl', 'apiKey']
    for (const param of requiredParams) {
      const value = this.getCurrentNodeParameter(param)
      if (!value) {
        throw new Error(`Required parameter ${param} is missing`)
      }
      config[param] = value
    }
    
    // Optional parameters with defaults
    const optionalParams = {
      timeout: 30000,
      retries: 3,
      batchSize: 50,
      enableLogging: false
    }
    
    for (const [param, defaultValue] of Object.entries(optionalParams)) {
      config[param] = this.getCurrentNodeParameter(param, defaultValue)
    }
    
    return config
  }
  
  const config = buildConfig()
  
  return [items]
}
```

### Parameter Inheritance

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Get base configuration
  const baseConfig = {
    timeout: this.getCurrentNodeParameter('timeout', 30000),
    retries: this.getCurrentNodeParameter('retries', 3)
  }
  
  // Override with operation-specific parameters
  const operation = this.getCurrentNodeParameter('operation')
  let operationConfig = {}
  
  if (operation === 'upload') {
    operationConfig = {
      chunkSize: this.getCurrentNodeParameter('chunkSize', 1024 * 1024),
      compression: this.getCurrentNodeParameter('compression', false)
    }
  } else if (operation === 'download') {
    operationConfig = {
      bufferSize: this.getCurrentNodeParameter('bufferSize', 64 * 1024),
      validateChecksum: this.getCurrentNodeParameter('validateChecksum', true)
    }
  }
  
  const finalConfig = { ...baseConfig, ...operationConfig }
  
  return [items]
}
```

### Parameter Validation Pipeline

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Validation pipeline
  const validators = [
    () => {
      const url = this.getCurrentNodeParameter('url')
      if (!url || typeof url !== 'string') {
        throw new Error('URL is required and must be a string')
      }
      if (!url.startsWith('http')) {
        throw new Error('URL must start with http or https')
      }
    },
    
    () => {
      const timeout = this.getCurrentNodeParameter('timeout', 30000)
      if (typeof timeout !== 'number' || timeout < 1000 || timeout > 300000) {
        throw new Error('Timeout must be between 1000 and 300000 milliseconds')
      }
    },
    
    () => {
      const method = this.getCurrentNodeParameter('method', 'GET')
      const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      if (!allowedMethods.includes(method)) {
        throw new Error(`Method must be one of: ${allowedMethods.join(', ')}`)
      }
    }
  ]
  
  // Run all validators
  for (const validator of validators) {
    validator()
  }
  
  return [items]
}
```

## Best Practices

1. **Always provide fallback values** for optional parameters
2. **Validate parameter types and values** before using them
3. **Use meaningful error messages** when parameters are invalid
4. **Group related parameters** into configuration objects
5. **Document parameter requirements** clearly
6. **Handle missing parameters gracefully**
7. **Use type-safe parameter access** when possible

## Comparison with getNodeParameter

### When to Use getCurrentNodeParameter vs getNodeParameter

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Use getNodeParameter for item-specific parameter access
  for (let i = 0; i < items.length; i++) {
    const itemSpecificValue = this.getNodeParameter('dynamicField', i)
    // Process with item-specific value
  }
  
  // Use getCurrentNodeParameter for node-level configuration
  const globalConfig = {
    apiUrl: this.getCurrentNodeParameter('apiUrl'),
    timeout: this.getCurrentNodeParameter('timeout', 30000),
    enableLogging: this.getCurrentNodeParameter('enableLogging', false)
  }
  
  return [items]
}
```

## Related Documentation

- [getNodeParameter](./getNodeParameter.md) - For item-specific parameter access
- [evaluateExpression](./evaluateExpression.md) - For dynamic expression evaluation
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
- [Base Helpers](../helpers/base.md) - Core helper functions
