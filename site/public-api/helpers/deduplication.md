---
title: Deduplication Helpers
description: Helper functions for deduplicating data in n8n nodes
---

# Deduplication Helpers

The deduplication helpers provide utilities for identifying and removing duplicate data within n8n workflows. These functions help optimize data processing by eliminating redundant items based on various criteria.

## When to Use

Use deduplication helpers when your node needs to:
- Remove duplicate items from datasets
- Identify unique records based on specific fields
- Merge similar items with different data
- Optimize data processing by reducing redundancy
- Implement data quality controls

## Available Functions

### `deduplicateItems()`

Removes duplicate items from an array based on specified criteria.

```typescript
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const dedupeField = this.getNodeParameter('dedupeField', 0) as string
  
  // Deduplicate based on a specific field
  const uniqueItems = this.helpers.deduplicateItems(items, {
    key: dedupeField,
    strategy: 'first' // Keep first occurrence
  })
  
  return [uniqueItems]
}
```

### `createDeduplicationKey()`

Creates a unique key for deduplication based on multiple fields.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const keyFields = this.getNodeParameter('keyFields', 0) as string[]
  
  const processedItems = items.map(item => {
    const dedupeKey = this.helpers.createDeduplicationKey(
      item.json,
      keyFields
    )
    
    return {
      ...item,
      json: {
        ...item.json,
        _dedupeKey: dedupeKey
      }
    }
  })
  
  return [processedItems]
}
```

### `findDuplicates()`

Identifies duplicate items without removing them.

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const keyField = this.getNodeParameter('keyField', 0) as string
  
  const duplicates = this.helpers.findDuplicates(items, {
    key: keyField,
    includeOriginal: true
  })
  
  return [{
    json: {
      totalItems: items.length,
      duplicateCount: duplicates.length,
      duplicates: duplicates.map(item => item.json)
    }
  }]
}
```

## Deduplication Strategies

### First Occurrence Strategy

Keep the first occurrence of duplicate items:

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const uniqueItems = this.helpers.deduplicateItems(items, {
    key: 'email',
    strategy: 'first'
  })
  
  return [uniqueItems]
}
```

### Last Occurrence Strategy

Keep the last occurrence of duplicate items:

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const uniqueItems = this.helpers.deduplicateItems(items, {
    key: 'id',
    strategy: 'last'
  })
  
  return [uniqueItems]
}
```

### Merge Strategy

Merge duplicate items by combining their data:

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const mergedItems = this.helpers.deduplicateItems(items, {
    key: 'userId',
    strategy: 'merge',
    mergeFunction: (existing, duplicate) => ({
      ...existing.json,
      ...duplicate.json,
      // Combine arrays
      tags: [...(existing.json.tags || []), ...(duplicate.json.tags || [])],
      // Keep latest timestamp
      lastUpdated: Math.max(existing.json.lastUpdated, duplicate.json.lastUpdated)
    })
  })
  
  return [mergedItems]
}
```

## Common Patterns

### Multi-Field Deduplication

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Create composite key from multiple fields
  const uniqueItems = this.helpers.deduplicateItems(items, {
    keyFunction: (item) => {
      const { firstName, lastName, email } = item.json
      return `${firstName}|${lastName}|${email}`.toLowerCase()
    },
    strategy: 'first'
  })
  
  return [uniqueItems]
}
```

### Case-Insensitive Deduplication

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const uniqueItems = this.helpers.deduplicateItems(items, {
    key: 'email',
    normalizeFunction: (value) => value.toLowerCase().trim(),
    strategy: 'first'
  })
  
  return [uniqueItems]
}
```

### Fuzzy Deduplication

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Use similarity threshold for fuzzy matching
  const uniqueItems = this.helpers.deduplicateItems(items, {
    key: 'companyName',
    strategy: 'fuzzy',
    similarityThreshold: 0.85,
    normalizeFunction: (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  })
  
  return [uniqueItems]
}
```

### Batch Deduplication

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const batchSize = this.getNodeParameter('batchSize', 0, 1000) as number
  
  const allUniqueItems = []
  
  // Process in batches to handle large datasets
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    const uniqueBatch = this.helpers.deduplicateItems(batch, {
      key: 'id',
      strategy: 'first'
    })
    
    allUniqueItems.push(...uniqueBatch)
  }
  
  // Final deduplication across all batches
  const finalUniqueItems = this.helpers.deduplicateItems(allUniqueItems, {
    key: 'id',
    strategy: 'first'
  })
  
  return [finalUniqueItems]
}
```

## Advanced Use Cases

### Conditional Deduplication

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const onlyActive = this.getNodeParameter('onlyActive', 0, false) as boolean
  
  let itemsToProcess = items
  
  // Pre-filter if needed
  if (onlyActive) {
    itemsToProcess = items.filter(item => item.json.status === 'active')
  }
  
  const uniqueItems = this.helpers.deduplicateItems(itemsToProcess, {
    key: 'email',
    strategy: 'custom',
    customStrategy: (existing, duplicate) => {
      // Keep item with higher priority
      const existingPriority = existing.json.priority || 0
      const duplicatePriority = duplicate.json.priority || 0
      
      return duplicatePriority > existingPriority ? duplicate : existing
    }
  })
  
  return [uniqueItems]
}
```

### Deduplication with Statistics

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  const result = this.helpers.deduplicateItems(items, {
    key: 'email',
    strategy: 'first',
    includeStats: true
  })
  
  return [{
    json: {
      originalCount: items.length,
      uniqueCount: result.items.length,
      duplicatesRemoved: result.stats.duplicatesRemoved,
      duplicateGroups: result.stats.duplicateGroups,
      items: result.items.map(item => item.json)
    }
  }]
}
```

### Cross-Reference Deduplication

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const referenceData = this.getNodeParameter('referenceData', 0) as any[]
  
  // Remove items that already exist in reference dataset
  const newItems = this.helpers.deduplicateItems(items, {
    key: 'id',
    strategy: 'exclude',
    referenceSet: new Set(referenceData.map(ref => ref.id))
  })
  
  return [newItems]
}
```

## Performance Considerations

### Memory-Efficient Deduplication

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Use streaming deduplication for large datasets
  const uniqueItems = this.helpers.deduplicateItemsStream(items, {
    key: 'id',
    strategy: 'first',
    memoryLimit: '100MB'
  })
  
  return [uniqueItems]
}
```

### Index-Based Deduplication

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Create index for faster lookups
  const dedupeIndex = this.helpers.createDeduplicationIndex(items, 'email')
  
  const uniqueItems = this.helpers.deduplicateWithIndex(items, {
    index: dedupeIndex,
    strategy: 'first'
  })
  
  return [uniqueItems]
}
```

## Best Practices

1. **Choose appropriate keys** for deduplication based on business logic
2. **Consider data normalization** for consistent matching
3. **Use batch processing** for large datasets
4. **Implement proper error handling** for malformed data
5. **Monitor performance** with large datasets
6. **Document deduplication logic** for maintainability
7. **Test edge cases** like null values and empty strings

## Error Handling

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const keyField = this.getNodeParameter('keyField', 0) as string
  
  try {
    // Validate that key field exists in all items
    const invalidItems = items.filter(item => 
      !item.json.hasOwnProperty(keyField) || 
      item.json[keyField] === null || 
      item.json[keyField] === undefined
    )
    
    if (invalidItems.length > 0) {
      throw new Error(`${invalidItems.length} items missing required field: ${keyField}`)
    }
    
    const uniqueItems = this.helpers.deduplicateItems(items, {
      key: keyField,
      strategy: 'first'
    })
    
    return [uniqueItems]
  } catch (error) {
    throw new Error(`Deduplication failed: ${error.message}`)
  }
}
```

## Related Documentation

- [Base Helpers](./base.md) - Core helper functions
- [Binary Data Helpers](./binary.md) - For deduplicating binary data
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
- [Error Handling](../../advanced/ErrorHandling.md) - Advanced error handling patterns
