---
title: getWorkflowStaticData
description: Access and manage persistent workflow-scoped static data
---

# getWorkflowStaticData

The `getWorkflowStaticData` function provides access to persistent, workflow-scoped static data that persists across workflow executions. This data is stored at the workflow level and can be used to maintain state, cache information, or store configuration that needs to persist between runs.

## When to Use

Use `getWorkflowStaticData` when your node needs to:
- Store state that persists across workflow executions
- Cache expensive computations or API responses
- Maintain counters, timestamps, or tracking information
- Store configuration that should persist between runs
- Implement rate limiting or throttling mechanisms
- Track execution history or statistics

## Function Signature

```typescript
getWorkflowStaticData(type: string): IDataObject
```

## Parameters

- **type**: The type/namespace of static data to access (e.g., 'global', 'node', 'user')

## Return Value

Returns an `IDataObject` that can be read from and written to. Changes are automatically persisted.

## Basic Usage

### Simple State Storage

```typescript
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Get workflow static data
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize counter if it doesn't exist
  if (!staticData.executionCount) {
    staticData.executionCount = 0
  }
  
  // Increment counter
  staticData.executionCount++
  staticData.lastExecuted = new Date().toISOString()
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        executionNumber: staticData.executionCount,
        lastExecuted: staticData.lastExecuted
      }
    })
  }
  
  return [results]
}
```

### Caching API Responses

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize cache if it doesn't exist
  if (!staticData.cache) {
    staticData.cache = {}
  }
  
  const results = []
  
  for (const item of items) {
    const cacheKey = `user_${item.json.userId}`
    const cacheExpiry = 5 * 60 * 1000 // 5 minutes
    
    // Check if we have cached data
    const cachedData = staticData.cache[cacheKey]
    const now = Date.now()
    
    let userData
    
    if (cachedData && (now - cachedData.timestamp) < cacheExpiry) {
      // Use cached data
      userData = cachedData.data
    } else {
      // Fetch fresh data
      userData = await fetchUserData(item.json.userId)
      
      // Cache the result
      staticData.cache[cacheKey] = {
        data: userData,
        timestamp: now
      }
    }
    
    results.push({
      json: {
        ...item.json,
        userData,
        fromCache: cachedData && (now - cachedData.timestamp) < cacheExpiry
      }
    })
  }
  
  return [results]
}
```

## Advanced Usage

### Rate Limiting

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize rate limiting data
  if (!staticData.rateLimiting) {
    staticData.rateLimiting = {
      requests: [],
      maxRequests: 100,
      timeWindow: 60 * 1000 // 1 minute
    }
  }
  
  const rateLimiting = staticData.rateLimiting
  const now = Date.now()
  
  // Clean old requests outside time window
  rateLimiting.requests = rateLimiting.requests.filter(
    timestamp => (now - timestamp) < rateLimiting.timeWindow
  )
  
  const results = []
  
  for (const item of items) {
    // Check rate limit
    if (rateLimiting.requests.length >= rateLimiting.maxRequests) {
      results.push({
        json: {
          ...item.json,
          error: 'Rate limit exceeded',
          rateLimitStatus: {
            current: rateLimiting.requests.length,
            max: rateLimiting.maxRequests,
            resetTime: Math.min(...rateLimiting.requests) + rateLimiting.timeWindow
          }
        }
      })
      continue
    }
    
    // Record this request
    rateLimiting.requests.push(now)
    
    // Process the item
    const result = await processItem(item)
    
    results.push({
      json: {
        ...result,
        rateLimitStatus: {
          current: rateLimiting.requests.length,
          max: rateLimiting.maxRequests,
          remaining: rateLimiting.maxRequests - rateLimiting.requests.length
        }
      }
    })
  }
  
  return [results]
}
```

### Configuration Management

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize configuration
  if (!staticData.config) {
    staticData.config = {
      apiEndpoints: {
        primary: 'https://api.example.com',
        fallback: 'https://backup-api.example.com'
      },
      retrySettings: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      features: {
        enableLogging: true,
        enableMetrics: false,
        enableCache: true
      },
      lastUpdated: new Date().toISOString()
    }
  }
  
  const config = staticData.config
  
  // Update configuration if needed
  const forceConfigUpdate = this.getNodeParameter('forceConfigUpdate', 0, false) as boolean
  if (forceConfigUpdate) {
    config.features.enableLogging = this.getNodeParameter('enableLogging', 0, true) as boolean
    config.features.enableMetrics = this.getNodeParameter('enableMetrics', 0, false) as boolean
    config.lastUpdated = new Date().toISOString()
  }
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        config: {
          ...config,
          // Don't expose sensitive configuration
          apiEndpoints: undefined
        }
      }
    })
  }
  
  return [results]
}
```

### Execution History Tracking

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize execution history
  if (!staticData.executionHistory) {
    staticData.executionHistory = {
      executions: [],
      maxHistory: 100,
      statistics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageItemsProcessed: 0
      }
    }
  }
  
  const history = staticData.executionHistory
  const executionStart = Date.now()
  
  let success = true
  const results = []
  
  try {
    for (const item of items) {
      const processedItem = await processItem(item)
      results.push(processedItem)
    }
  } catch (error) {
    success = false
    throw error
  } finally {
    // Record execution
    const executionEnd = Date.now()
    const execution = {
      timestamp: new Date().toISOString(),
      duration: executionEnd - executionStart,
      itemsProcessed: items.length,
      success,
      error: success ? null : 'Execution failed'
    }
    
    // Add to history
    history.executions.push(execution)
    
    // Trim history if too long
    if (history.executions.length > history.maxHistory) {
      history.executions = history.executions.slice(-history.maxHistory)
    }
    
    // Update statistics
    history.statistics.totalExecutions++
    if (success) {
      history.statistics.successfulExecutions++
    } else {
      history.statistics.failedExecutions++
    }
    
    // Calculate average items processed
    const totalItems = history.executions.reduce((sum, exec) => sum + exec.itemsProcessed, 0)
    history.statistics.averageItemsProcessed = totalItems / history.executions.length
  }
  
  return [results]
}
```

## Data Management Patterns

### Namespaced Data Storage

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const nodeType = this.getNode().type
  
  // Use node-specific namespace
  const staticData = this.getWorkflowStaticData('global')
  
  // Create namespace for this node type
  if (!staticData[nodeType]) {
    staticData[nodeType] = {
      settings: {},
      cache: {},
      counters: {},
      lastAccess: new Date().toISOString()
    }
  }
  
  const nodeData = staticData[nodeType]
  nodeData.lastAccess = new Date().toISOString()
  
  // Use namespaced data
  if (!nodeData.counters.processedItems) {
    nodeData.counters.processedItems = 0
  }
  
  nodeData.counters.processedItems += items.length
  
  return [items]
}
```

### Data Cleanup and Maintenance

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize cleanup settings
  if (!staticData.cleanup) {
    staticData.cleanup = {
      lastCleanup: 0,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxHistoryEntries: 1000
    }
  }
  
  const now = Date.now()
  const cleanup = staticData.cleanup
  
  // Perform cleanup if needed
  if ((now - cleanup.lastCleanup) > cleanup.cleanupInterval) {
    // Clean old cache entries
    if (staticData.cache) {
      Object.keys(staticData.cache).forEach(key => {
        const entry = staticData.cache[key]
        if (entry.timestamp && (now - entry.timestamp) > cleanup.maxCacheAge) {
          delete staticData.cache[key]
        }
      })
    }
    
    // Clean old history entries
    if (staticData.executionHistory?.executions) {
      const maxEntries = cleanup.maxHistoryEntries
      if (staticData.executionHistory.executions.length > maxEntries) {
        staticData.executionHistory.executions = 
          staticData.executionHistory.executions.slice(-maxEntries)
      }
    }
    
    // Update cleanup timestamp
    cleanup.lastCleanup = now
  }
  
  return [items]
}
```

### Conditional Data Initialization

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize data based on workflow configuration
  const workflowName = this.getWorkflow().name
  const isProduction = workflowName?.includes('Production')
  
  if (!staticData.environment) {
    staticData.environment = {
      type: isProduction ? 'production' : 'development',
      settings: isProduction ? {
        logLevel: 'error',
        cacheEnabled: true,
        metricsEnabled: true,
        debugMode: false
      } : {
        logLevel: 'debug',
        cacheEnabled: false,
        metricsEnabled: false,
        debugMode: true
      },
      initialized: new Date().toISOString()
    }
  }
  
  const environment = staticData.environment
  
  // Use environment-specific processing
  const results = []
  
  for (const item of items) {
    let processedItem = { ...item.json }
    
    if (environment.settings.debugMode) {
      processedItem._debug = {
        environment: environment.type,
        timestamp: new Date().toISOString(),
        nodeId: this.getNode().id
      }
    }
    
    results.push({ json: processedItem })
  }
  
  return [results]
}
```

## Performance Considerations

### Memory Management

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Monitor static data size
  const getDataSize = (obj: any): number => {
    return JSON.stringify(obj).length
  }
  
  const currentSize = getDataSize(staticData)
  const maxSize = 10 * 1024 * 1024 // 10MB limit
  
  if (currentSize > maxSize) {
    // Implement data reduction strategy
    if (staticData.cache) {
      // Remove oldest cache entries
      const cacheEntries = Object.entries(staticData.cache)
        .map(([key, value]: [string, any]) => ({ key, ...value }))
        .sort((a, b) => a.timestamp - b.timestamp)
      
      // Remove oldest 25% of entries
      const toRemove = Math.floor(cacheEntries.length * 0.25)
      for (let i = 0; i < toRemove; i++) {
        delete staticData.cache[cacheEntries[i].key]
      }
    }
  }
  
  return [items]
}
```

### Efficient Data Access

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Use lazy initialization for expensive data structures
  const getOrCreateIndex = () => {
    if (!staticData._searchIndex) {
      staticData._searchIndex = new Map()
      staticData._indexLastBuilt = Date.now()
    }
    return staticData._searchIndex
  }
  
  // Rebuild index if stale
  const indexAge = Date.now() - (staticData._indexLastBuilt || 0)
  const maxIndexAge = 60 * 60 * 1000 // 1 hour
  
  if (indexAge > maxIndexAge) {
    delete staticData._searchIndex
    staticData._indexLastBuilt = Date.now()
  }
  
  const searchIndex = getOrCreateIndex()
  
  return [items]
}
```

## Best Practices

1. **Use appropriate namespaces** to avoid data conflicts
2. **Implement data cleanup** to prevent memory bloat
3. **Monitor data size** and implement size limits
4. **Use lazy initialization** for expensive data structures
5. **Handle concurrent access** carefully in multi-execution scenarios
6. **Document data structure** and lifecycle
7. **Consider data migration** when changing data formats

## Common Pitfalls

### Avoiding Data Corruption

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Use atomic updates for critical data
  const updateCounter = (key: string, increment: number = 1) => {
    if (!staticData.counters) {
      staticData.counters = {}
    }
    
    const current = staticData.counters[key] || 0
    staticData.counters[key] = current + increment
    
    return staticData.counters[key]
  }
  
  // Avoid direct mutation of complex objects
  const updateConfig = (updates: any) => {
    staticData.config = {
      ...staticData.config,
      ...updates,
      lastUpdated: new Date().toISOString()
    }
  }
  
  return [items]
}
```

## Related Documentation

- [getWorkflow](./getWorkflow.md) - For accessing workflow information
- [executeWorkflow](./executeWorkflow.md) - For executing sub-workflows
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
- [Base Helpers](../helpers/base.md) - Core helper functions
