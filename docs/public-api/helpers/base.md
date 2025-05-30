---
title: Base Helpers
description: Core helper functions available in all n8n node execution contexts
---

# Base Helpers

The base helpers provide fundamental utility functions that are available across all n8n node execution contexts. These are the core building blocks for data manipulation, validation, and common operations within nodes.

## When to Use

Use base helpers when your node needs to:
- Perform common data transformations
- Validate input data and parameters
- Handle errors and logging
- Work with dates, strings, and objects
- Implement utility functions for data processing

## Available Functions

### `returnJsonArray()`

Converts data to the standard n8n item format with JSON data.

```typescript
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const rawData = [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 }
  ]
  
  // Convert to n8n item format
  const items = this.helpers.returnJsonArray(rawData)
  
  return [items]
}
```

### `normalizeItems()`

Ensures all items have consistent structure and required properties.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Normalize items to ensure consistent structure
  const normalizedItems = this.helpers.normalizeItems(items, {
    ensureArray: true,
    removeEmpty: true,
    defaultValues: {
      id: null,
      status: 'active'
    }
  })
  
  return [normalizedItems]
}
```

### `constructExecutionMetaData()`

Creates metadata for tracking execution information.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const processedItems = []
  
  for (const item of items) {
    const processedItem = {
      json: {
        ...item.json,
        processedAt: new Date().toISOString()
      }
    }
    
    // Add execution metadata
    const itemWithMetadata = this.helpers.constructExecutionMetaData(
      processedItem,
      { itemData: { item: 0 } }
    )
    
    processedItems.push(itemWithMetadata)
  }
  
  return [processedItems]
}
```

## Data Validation

### `validateData()`

Validates input data against specified criteria.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    // Validate required fields
    const validation = this.helpers.validateData(item.json, {
      required: ['email', 'name'],
      types: {
        email: 'string',
        name: 'string',
        age: 'number'
      },
      patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    })
    
    if (!validation.isValid) {
      throw new Error(`Item ${i}: ${validation.errors.join(', ')}`)
    }
  }
  
  return [items]
}
```

### `assertBinaryData()`

Validates and retrieves binary data from items.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const processedItems = []
  
  for (let i = 0; i < items.length; i++) {
    // Assert binary data exists
    const binaryData = this.helpers.assertBinaryData(i, 'attachment')
    
    processedItems.push({
      json: {
        fileName: binaryData.fileName,
        mimeType: binaryData.mimeType,
        fileSize: binaryData.fileSize
      }
    })
  }
  
  return [processedItems]
}
```

## String and Data Utilities

### `slugify()`

Converts strings to URL-friendly slugs.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const processedItems = items.map(item => ({
    json: {
      ...item.json,
      slug: this.helpers.slugify(item.json.title),
      urlPath: this.helpers.slugify(item.json.title, { 
        lower: true,
        strict: true 
      })
    }
  }))
  
  return [processedItems]
}
```

### `deepCopy()`

Creates deep copies of objects to avoid reference issues.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const template = this.getNodeParameter('template', 0) as object
  
  const processedItems = items.map(item => {
    // Deep copy template to avoid mutations
    const itemTemplate = this.helpers.deepCopy(template)
    
    return {
      json: {
        ...itemTemplate,
        ...item.json
      }
    }
  })
  
  return [processedItems]
}
```

### `flattenObject()`

Flattens nested objects into dot-notation keys.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const flattenedItems = items.map(item => ({
    json: this.helpers.flattenObject(item.json, {
      delimiter: '.',
      maxDepth: 5
    })
  }))
  
  return [flattenedItems]
}
```

## Date and Time Utilities

### `formatDateTime()`

Formats dates according to specified patterns.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const format = this.getNodeParameter('dateFormat', 0, 'YYYY-MM-DD') as string
  
  const formattedItems = items.map(item => ({
    json: {
      ...item.json,
      formattedDate: this.helpers.formatDateTime(
        item.json.createdAt,
        format
      ),
      timestamp: this.helpers.formatDateTime(
        new Date(),
        'X' // Unix timestamp
      )
    }
  }))
  
  return [formattedItems]
}
```

### `parseDateTime()`

Parses date strings into Date objects.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const parsedItems = items.map(item => {
    const parsedDate = this.helpers.parseDateTime(
      item.json.dateString,
      'DD/MM/YYYY'
    )
    
    return {
      json: {
        ...item.json,
        parsedDate: parsedDate.toISOString(),
        isValid: parsedDate instanceof Date && !isNaN(parsedDate.getTime())
      }
    }
  })
  
  return [parsedItems]
}
```

## Error Handling and Logging

### `logNodeOutput()`

Logs node output for debugging purposes.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const debugMode = this.getNodeParameter('debug', 0, false) as boolean
  
  if (debugMode) {
    this.helpers.logNodeOutput('Input items', items)
  }
  
  const processedItems = items.map(item => ({
    json: {
      ...item.json,
      processed: true
    }
  }))
  
  if (debugMode) {
    this.helpers.logNodeOutput('Processed items', processedItems)
  }
  
  return [processedItems]
}
```

### `createErrorItem()`

Creates standardized error items for failed operations.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    try {
      // Process item
      const result = await processItem(items[i])
      results.push(result)
    } catch (error) {
      // Create error item
      const errorItem = this.helpers.createErrorItem(
        items[i],
        error,
        i
      )
      results.push(errorItem)
    }
  }
  
  return [results]
}
```

## Common Patterns

### Batch Processing

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const batchSize = this.getNodeParameter('batchSize', 0, 100) as number
  
  const allResults = []
  
  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    const batchResults = this.helpers.processBatch(batch, {
      concurrency: 5,
      retries: 3,
      onProgress: (processed, total) => {
        this.helpers.logNodeOutput(`Processed ${processed}/${total} items`)
      }
    })
    
    allResults.push(...batchResults)
  }
  
  return [allResults]
}
```

### Data Transformation Pipeline

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const transformedItems = this.helpers.transformData(items, [
    // Step 1: Normalize data
    (items) => this.helpers.normalizeItems(items),
    
    // Step 2: Validate data
    (items) => items.filter(item => 
      this.helpers.validateData(item.json, { required: ['id'] }).isValid
    ),
    
    // Step 3: Enrich data
    (items) => items.map(item => ({
      ...item,
      json: {
        ...item.json,
        enrichedAt: new Date().toISOString()
      }
    })),
    
    // Step 4: Format output
    (items) => this.helpers.returnJsonArray(
      items.map(item => item.json)
    )
  ])
  
  return [transformedItems]
}
```

### Conditional Processing

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const condition = this.getNodeParameter('condition', 0) as string
  
  const processedItems = items.map(item => {
    const shouldProcess = this.helpers.evaluateCondition(
      condition,
      item.json
    )
    
    if (shouldProcess) {
      return {
        json: {
          ...item.json,
          processed: true,
          processedAt: new Date().toISOString()
        }
      }
    }
    
    return item
  })
  
  return [processedItems]
}
```

## Performance Optimization

### Memory Management

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Process large datasets efficiently
  const results = this.helpers.processLargeDataset(items, {
    chunkSize: 1000,
    memoryLimit: '500MB',
    processor: async (chunk) => {
      return chunk.map(item => ({
        json: {
          id: item.json.id,
          processed: true
        }
      }))
    }
  })
  
  return [results]
}
```

### Caching

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const cacheKey = this.getNodeParameter('cacheKey', 0) as string
  
  // Check cache first
  const cached = this.helpers.getFromCache(cacheKey)
  if (cached) {
    return [cached]
  }
  
  // Process data
  const processedItems = items.map(item => ({
    json: {
      ...item.json,
      processed: true
    }
  }))
  
  // Cache results
  this.helpers.setCache(cacheKey, processedItems, {
    ttl: 3600 // 1 hour
  })
  
  return [processedItems]
}
```

## Best Practices

1. **Always validate input data** before processing
2. **Use appropriate data types** for parameters and return values
3. **Handle errors gracefully** with meaningful messages
4. **Log important operations** for debugging
5. **Optimize for performance** with large datasets
6. **Use caching** for expensive operations
7. **Follow consistent naming conventions**

## Error Handling

```typescript
export async function execute(this: IExecuteFunctions) {
  try {
    const items = this.getInputData()
    
    // Validate input
    if (!items || items.length === 0) {
      throw new Error('No input data provided')
    }
    
    // Process items with error handling
    const results = []
    for (let i = 0; i < items.length; i++) {
      try {
        const result = await this.helpers.processItem(items[i])
        results.push(result)
      } catch (itemError) {
        this.helpers.logNodeOutput(`Error processing item ${i}`, itemError)
        
        // Continue processing other items
        results.push(this.helpers.createErrorItem(
          items[i],
          itemError,
          i
        ))
      }
    }
    
    return [results]
  } catch (error) {
    throw new Error(`Node execution failed: ${error.message}`)
  }
}
```

## Related Documentation

- [HTTP Helpers](./http.md) - For HTTP-specific operations
- [Binary Data Helpers](./binary.md) - For binary data handling
- [Filesystem Helpers](./filesystem.md) - For file operations
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
- [Error Handling](../../advanced/ErrorHandling.md) - Advanced error handling patterns
