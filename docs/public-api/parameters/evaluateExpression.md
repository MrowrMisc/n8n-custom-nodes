---
title: evaluateExpression
description: Evaluate n8n expressions and access workflow data dynamically
---

# evaluateExpression

The `evaluateExpression` function allows you to evaluate n8n expressions dynamically within your node code. This enables access to workflow data, previous node outputs, and built-in functions using n8n's expression syntax.

## When to Use

Use `evaluateExpression` when your node needs to:
- Dynamically evaluate user-provided expressions
- Access data from previous nodes in the workflow
- Use n8n's built-in expression functions
- Implement conditional logic based on workflow data
- Transform data using expressions rather than hardcoded logic

## Function Signature

```typescript
evaluateExpression(
  expression: string,
  itemIndex: number,
  additionalKeys?: IWorkflowDataProxyAdditionalKeys,
  executeData?: IExecuteData,
  mode?: WorkflowExecuteMode,
  timezone?: string
): any
```

## Parameters

- **expression**: The n8n expression string to evaluate
- **itemIndex**: Index of the current item being processed
- **additionalKeys**: Optional additional data to make available in expressions
- **executeData**: Optional execution data context
- **mode**: Optional workflow execution mode
- **timezone**: Optional timezone for date operations

## Basic Usage

### Simple Expression Evaluation

```typescript
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const expression = this.getNodeParameter('expression', 0) as string
  
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Evaluate expression for current item
    const result = this.evaluateExpression(expression, i)
    
    results.push({
      json: {
        originalData: items[i].json,
        expressionResult: result
      }
    })
  }
  
  return [results]
}
```

### Accessing Previous Node Data

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Access data from previous nodes
    const userName = this.evaluateExpression('{{ $("HTTP Request").first().json.user.name }}', i)
    const timestamp = this.evaluateExpression('{{ $now }}', i)
    const itemCount = this.evaluateExpression('{{ $("HTTP Request").length }}', i)
    
    results.push({
      json: {
        userName,
        timestamp,
        itemCount,
        currentItem: items[i].json
      }
    })
  }
  
  return [results]
}
```

## Common Expression Patterns

### Working with Current Item Data

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Access current item properties
    const fullName = this.evaluateExpression('{{ $json.firstName + " " + $json.lastName }}', i)
    const isActive = this.evaluateExpression('{{ $json.status === "active" }}', i)
    const age = this.evaluateExpression('{{ $json.birthYear ? new Date().getFullYear() - $json.birthYear : null }}', i)
    
    results.push({
      json: {
        ...items[i].json,
        fullName,
        isActive,
        age
      }
    })
  }
  
  return [results]
}
```

### Conditional Logic

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const condition = this.getNodeParameter('condition', 0) as string
  
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Evaluate condition
    const shouldProcess = this.evaluateExpression(condition, i)
    
    if (shouldProcess) {
      const processedData = this.evaluateExpression('{{ $json.value * 2 }}', i)
      
      results.push({
        json: {
          ...items[i].json,
          processed: true,
          processedValue: processedData
        }
      })
    } else {
      results.push({
        json: {
          ...items[i].json,
          processed: false,
          reason: 'Condition not met'
        }
      })
    }
  }
  
  return [results]
}
```

### Using Built-in Functions

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Use various built-in functions
    const formattedDate = this.evaluateExpression('{{ $now.format("YYYY-MM-DD") }}', i)
    const randomId = this.evaluateExpression('{{ $randomString(10) }}', i)
    const hashedEmail = this.evaluateExpression('{{ $hash($json.email, "sha256") }}', i)
    const upperName = this.evaluateExpression('{{ $json.name.toUpperCase() }}', i)
    
    results.push({
      json: {
        ...items[i].json,
        formattedDate,
        randomId,
        hashedEmail,
        upperName
      }
    })
  }
  
  return [results]
}
```

## Advanced Usage

### Custom Additional Keys

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const customData = this.getNodeParameter('customData', 0) as object
  
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Provide additional data to expressions
    const additionalKeys = {
      $custom: customData,
      $config: {
        apiUrl: 'https://api.example.com',
        version: '1.0'
      }
    }
    
    const result = this.evaluateExpression(
      '{{ $json.id + "-" + $custom.prefix + "-" + $config.version }}',
      i,
      additionalKeys
    )
    
    results.push({
      json: {
        ...items[i].json,
        generatedId: result
      }
    })
  }
  
  return [results]
}
```

### Dynamic Expression Building

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const fieldName = this.getNodeParameter('fieldName', 0) as string
  const operation = this.getNodeParameter('operation', 0) as string
  
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Build expression dynamically
    let expression = ''
    
    switch (operation) {
      case 'uppercase':
        expression = `{{ $json.${fieldName}.toUpperCase() }}`
        break
      case 'length':
        expression = `{{ $json.${fieldName}.length }}`
        break
      case 'reverse':
        expression = `{{ $json.${fieldName}.split("").reverse().join("") }}`
        break
      default:
        expression = `{{ $json.${fieldName} }}`
    }
    
    const result = this.evaluateExpression(expression, i)
    
    results.push({
      json: {
        ...items[i].json,
        [`${fieldName}_${operation}`]: result
      }
    })
  }
  
  return [results]
}
```

### Error Handling in Expressions

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const expressions = this.getNodeParameter('expressions', 0) as string[]
  
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    const itemResult: any = { ...items[i].json }
    
    for (const expression of expressions) {
      try {
        const result = this.evaluateExpression(expression, i)
        itemResult[`expr_${expressions.indexOf(expression)}`] = result
      } catch (error) {
        itemResult[`expr_${expressions.indexOf(expression)}_error`] = error.message
        itemResult[`expr_${expressions.indexOf(expression)}`] = null
      }
    }
    
    results.push({ json: itemResult })
  }
  
  return [results]
}
```

## Working with Complex Data

### Array and Object Manipulation

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Complex array operations
    const filteredItems = this.evaluateExpression(
      '{{ $json.items.filter(item => item.status === "active") }}',
      i
    )
    
    const mappedValues = this.evaluateExpression(
      '{{ $json.items.map(item => item.name.toUpperCase()) }}',
      i
    )
    
    const totalValue = this.evaluateExpression(
      '{{ $json.items.reduce((sum, item) => sum + item.value, 0) }}',
      i
    )
    
    results.push({
      json: {
        ...items[i].json,
        filteredItems,
        mappedValues,
        totalValue
      }
    })
  }
  
  return [results]
}
```

### Cross-Node Data Access

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Access data from multiple previous nodes
    const userData = this.evaluateExpression('{{ $("Get User").first().json }}', i)
    const settingsData = this.evaluateExpression('{{ $("Get Settings").first().json }}', i)
    
    // Combine data from different sources
    const combinedData = this.evaluateExpression(`
      {{
        {
          userId: $("Get User").first().json.id,
          userName: $("Get User").first().json.name,
          theme: $("Get Settings").first().json.theme,
          currentData: $json
        }
      }}
    `, i)
    
    results.push({
      json: combinedData
    })
  }
  
  return [results]
}
```

## Performance Considerations

### Caching Expression Results

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const expression = this.getNodeParameter('expression', 0) as string
  
  // Cache for expressions that don't depend on item data
  const expressionCache = new Map<string, any>()
  
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    let result
    
    // Check if expression uses item-specific data
    if (expression.includes('$json') || expression.includes('$item')) {
      // Evaluate for each item
      result = this.evaluateExpression(expression, i)
    } else {
      // Use cached result for static expressions
      if (!expressionCache.has(expression)) {
        expressionCache.set(expression, this.evaluateExpression(expression, i))
      }
      result = expressionCache.get(expression)
    }
    
    results.push({
      json: {
        ...items[i].json,
        result
      }
    })
  }
  
  return [results]
}
```

### Batch Expression Evaluation

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const expressions = this.getNodeParameter('expressions', 0) as string[]
  
  const results = []
  
  // Pre-evaluate static expressions
  const staticResults = new Map<string, any>()
  for (const expr of expressions) {
    if (!expr.includes('$json') && !expr.includes('$item')) {
      staticResults.set(expr, this.evaluateExpression(expr, 0))
    }
  }
  
  for (let i = 0; i < items.length; i++) {
    const itemResult: any = { ...items[i].json }
    
    for (const expression of expressions) {
      if (staticResults.has(expression)) {
        itemResult[`expr_${expressions.indexOf(expression)}`] = staticResults.get(expression)
      } else {
        itemResult[`expr_${expressions.indexOf(expression)}`] = this.evaluateExpression(expression, i)
      }
    }
    
    results.push({ json: itemResult })
  }
  
  return [results]
}
```

## Best Practices

1. **Validate expressions** before evaluation to prevent runtime errors
2. **Cache static expressions** that don't depend on item data
3. **Handle errors gracefully** when expressions fail
4. **Use meaningful variable names** in complex expressions
5. **Document complex expressions** for maintainability
6. **Test expressions** with various data types and edge cases
7. **Consider performance** when evaluating many expressions

## Common Pitfalls

### Handling Undefined Values

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    // Safe property access with fallbacks
    const safeValue = this.evaluateExpression(
      '{{ $json.nested?.property ?? "default" }}',
      i
    )
    
    // Check for existence before operations
    const conditionalResult = this.evaluateExpression(
      '{{ $json.value ? $json.value * 2 : 0 }}',
      i
    )
    
    results.push({
      json: {
        ...items[i].json,
        safeValue,
        conditionalResult
      }
    })
  }
  
  return [results]
}
```

## Related Documentation

- [getNodeParameter](./getNodeParameter.md) - For accessing node parameters
- [getCurrentNodeParameter](./getCurrentNodeParameter.md) - For current node parameter access
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
- [Base Helpers](../helpers/base.md) - Core helper functions
