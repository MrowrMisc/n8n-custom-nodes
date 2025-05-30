---
title: executeWorkflow
description: Execute sub-workflows programmatically from within a node
---

# executeWorkflow

The `executeWorkflow` function allows you to programmatically execute another workflow from within a node. This enables modular workflow design, reusable workflow components, and complex orchestration patterns.

## When to Use

Use `executeWorkflow` when your node needs to:
- Execute reusable workflow components
- Implement modular workflow architecture
- Orchestrate complex multi-step processes
- Call specialized workflows for specific tasks
- Implement workflow-based microservices patterns
- Create workflow templates and compositions

## Function Signature

```typescript
executeWorkflow(
  workflowInfo: IExecuteWorkflowInfo,
  items: INodeExecutionData[],
  options?: IExecuteWorkflowOptions
): Promise<INodeExecutionData[][]>
```

## Parameters

- **workflowInfo**: Information about the workflow to execute (ID or name)
- **items**: Input data to pass to the sub-workflow
- **options**: Optional execution configuration

## Return Value

Returns a Promise that resolves to an array of arrays containing the execution results from the sub-workflow.

## Basic Usage

### Execute Workflow by ID

```typescript
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const subWorkflowId = this.getNodeParameter('workflowId', 0) as string
  
  const results = []
  
  for (const item of items) {
    try {
      // Execute sub-workflow with current item
      const subWorkflowResults = await this.executeWorkflow(
        { id: subWorkflowId },
        [item]
      )
      
      // Process results from sub-workflow
      const processedResults = subWorkflowResults[0] || []
      
      results.push({
        json: {
          originalData: item.json,
          subWorkflowResults: processedResults.map(result => result.json),
          executedWorkflowId: subWorkflowId,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      results.push({
        json: {
          originalData: item.json,
          error: error.message,
          workflowId: subWorkflowId,
          timestamp: new Date().toISOString()
        }
      })
    }
  }
  
  return [results]
}
```

### Execute Workflow by Name

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflowName = this.getNodeParameter('workflowName', 0) as string
  
  const results = []
  
  for (const item of items) {
    // Execute workflow by name
    const subWorkflowResults = await this.executeWorkflow(
      { name: workflowName },
      [item],
      {
        loadedWorkflowData: undefined, // Let n8n resolve the workflow
        loadedRunData: undefined
      }
    )
    
    results.push({
      json: {
        ...item.json,
        processedBy: workflowName,
        results: subWorkflowResults[0]?.map(result => result.json) || []
      }
    })
  }
  
  return [results]
}
```

## Advanced Usage

### Batch Processing with Sub-Workflows

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const batchSize = this.getNodeParameter('batchSize', 0, 10) as number
  const processingWorkflowId = this.getNodeParameter('processingWorkflowId', 0) as string
  
  const results = []
  
  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    try {
      // Execute sub-workflow with batch
      const batchResults = await this.executeWorkflow(
        { id: processingWorkflowId },
        batch,
        {
          parentExecution: {
            executionId: this.getExecutionId(),
            workflowId: this.getWorkflow().id
          }
        }
      )
      
      // Flatten results from all output branches
      const flattenedResults = batchResults.flat()
      
      results.push({
        json: {
          batchNumber: Math.floor(i / batchSize) + 1,
          batchSize: batch.length,
          processedItems: flattenedResults.length,
          results: flattenedResults.map(result => result.json),
          processingTime: new Date().toISOString()
        }
      })
    } catch (error) {
      results.push({
        json: {
          batchNumber: Math.floor(i / batchSize) + 1,
          batchSize: batch.length,
          error: error.message,
          failedItems: batch.map(item => item.json)
        }
      })
    }
  }
  
  return [results]
}
```

### Conditional Workflow Execution

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Define workflow mappings based on conditions
  const workflowMappings = {
    'high_priority': this.getNodeParameter('highPriorityWorkflowId', 0) as string,
    'medium_priority': this.getNodeParameter('mediumPriorityWorkflowId', 0) as string,
    'low_priority': this.getNodeParameter('lowPriorityWorkflowId', 0) as string,
    'default': this.getNodeParameter('defaultWorkflowId', 0) as string
  }
  
  const results = []
  
  for (const item of items) {
    // Determine which workflow to execute
    const priority = item.json.priority || 'default'
    const workflowId = workflowMappings[priority] || workflowMappings['default']
    
    try {
      const subWorkflowResults = await this.executeWorkflow(
        { id: workflowId },
        [item],
        {
          // Pass additional context
          additionalData: {
            priority,
            parentWorkflow: this.getWorkflow().name,
            executionContext: 'conditional_routing'
          }
        }
      )
      
      results.push({
        json: {
          ...item.json,
          processedBy: workflowId,
          priority,
          results: subWorkflowResults[0]?.map(result => result.json) || []
        }
      })
    } catch (error) {
      results.push({
        json: {
          ...item.json,
          error: error.message,
          priority,
          failedWorkflowId: workflowId
        }
      })
    }
  }
  
  return [results]
}
```

### Parallel Workflow Execution

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const maxConcurrency = this.getNodeParameter('maxConcurrency', 0, 3) as number
  const workflowIds = this.getNodeParameter('workflowIds', 0) as string[]
  
  const results = []
  
  // Process items with controlled concurrency
  const processItem = async (item: any) => {
    const itemResults = []
    
    // Execute multiple workflows for each item
    const workflowPromises = workflowIds.map(async (workflowId) => {
      try {
        const subWorkflowResults = await this.executeWorkflow(
          { id: workflowId },
          [item]
        )
        
        return {
          workflowId,
          success: true,
          results: subWorkflowResults[0] || []
        }
      } catch (error) {
        return {
          workflowId,
          success: false,
          error: error.message
        }
      }
    })
    
    const workflowResults = await Promise.all(workflowPromises)
    
    return {
      json: {
        originalData: item.json,
        workflowResults,
        executionSummary: {
          total: workflowIds.length,
          successful: workflowResults.filter(r => r.success).length,
          failed: workflowResults.filter(r => !r.success).length
        }
      }
    }
  }
  
  // Control concurrency
  const semaphore = new Array(maxConcurrency).fill(null)
  const processQueue = items.map(item => () => processItem(item))
  
  const processWithConcurrency = async () => {
    const results = []
    let index = 0
    
    const workers = semaphore.map(async () => {
      while (index < processQueue.length) {
        const currentIndex = index++
        const processor = processQueue[currentIndex]
        const result = await processor()
        results[currentIndex] = result
      }
    })
    
    await Promise.all(workers)
    return results.filter(Boolean)
  }
  
  const processedResults = await processWithConcurrency()
  
  return [processedResults]
}
```

## Workflow Orchestration Patterns

### Pipeline Pattern

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const pipelineSteps = this.getNodeParameter('pipelineSteps', 0) as Array<{
    workflowId: string
    name: string
    required: boolean
  }>
  
  const results = []
  
  for (const item of items) {
    let currentData = [item]
    const pipelineResults = []
    
    // Execute pipeline steps sequentially
    for (const step of pipelineSteps) {
      try {
        const stepResults = await this.executeWorkflow(
          { id: step.workflowId },
          currentData
        )
        
        pipelineResults.push({
          step: step.name,
          workflowId: step.workflowId,
          success: true,
          outputCount: stepResults[0]?.length || 0
        })
        
        // Use output as input for next step
        currentData = stepResults[0] || []
        
        // If no output and step is required, fail the pipeline
        if (currentData.length === 0 && step.required) {
          throw new Error(`Required step '${step.name}' produced no output`)
        }
      } catch (error) {
        pipelineResults.push({
          step: step.name,
          workflowId: step.workflowId,
          success: false,
          error: error.message
        })
        
        if (step.required) {
          break // Stop pipeline on required step failure
        }
      }
    }
    
    results.push({
      json: {
        originalData: item.json,
        pipelineResults,
        finalOutput: currentData.map(d => d.json),
        pipelineSuccess: pipelineResults.every(r => r.success || !r.required)
      }
    })
  }
  
  return [results]
}
```

### Fan-Out/Fan-In Pattern

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const fanOutWorkflows = this.getNodeParameter('fanOutWorkflows', 0) as string[]
  const fanInWorkflowId = this.getNodeParameter('fanInWorkflowId', 0) as string
  
  const results = []
  
  for (const item of items) {
    // Fan-out: Execute multiple workflows in parallel
    const fanOutPromises = fanOutWorkflows.map(async (workflowId) => {
      try {
        const results = await this.executeWorkflow(
          { id: workflowId },
          [item]
        )
        return {
          workflowId,
          success: true,
          data: results[0] || []
        }
      } catch (error) {
        return {
          workflowId,
          success: false,
          error: error.message,
          data: []
        }
      }
    })
    
    const fanOutResults = await Promise.all(fanOutPromises)
    
    // Collect all successful results
    const allFanOutData = fanOutResults
      .filter(result => result.success)
      .flatMap(result => result.data)
    
    // Fan-in: Aggregate results through final workflow
    let fanInResults = []
    if (allFanOutData.length > 0) {
      try {
        const aggregatedResults = await this.executeWorkflow(
          { id: fanInWorkflowId },
          allFanOutData
        )
        fanInResults = aggregatedResults[0] || []
      } catch (error) {
        // Handle fan-in failure
        fanInResults = [{
          json: {
            error: 'Fan-in workflow failed',
            details: error.message,
            inputData: allFanOutData.map(d => d.json)
          }
        }]
      }
    }
    
    results.push({
      json: {
        originalData: item.json,
        fanOutResults: fanOutResults.map(r => ({
          workflowId: r.workflowId,
          success: r.success,
          error: r.error,
          outputCount: r.data.length
        })),
        fanInResults: fanInResults.map(r => r.json),
        totalProcessed: allFanOutData.length
      }
    })
  }
  
  return [results]
}
```

### Error Handling and Retry Logic

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflowId = this.getNodeParameter('workflowId', 0) as string
  const maxRetries = this.getNodeParameter('maxRetries', 0, 3) as number
  const retryDelay = this.getNodeParameter('retryDelay', 0, 1000) as number
  
  const executeWithRetry = async (item: any, retries: number = 0): Promise<any> => {
    try {
      const results = await this.executeWorkflow(
        { id: workflowId },
        [item],
        {
          timeout: 30000, // 30 second timeout
          continueOnFail: false
        }
      )
      
      return {
        success: true,
        data: results[0] || [],
        retries
      }
    } catch (error) {
      if (retries < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retries)))
        return executeWithRetry(item, retries + 1)
      } else {
        return {
          success: false,
          error: error.message,
          retries,
          finalFailure: true
        }
      }
    }
  }
  
  const results = []
  
  for (const item of items) {
    const result = await executeWithRetry(item)
    
    results.push({
      json: {
        originalData: item.json,
        ...result,
        workflowId,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  return [results]
}
```

## Performance Considerations

### Workflow Caching

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Cache workflow metadata
  if (!staticData.workflowCache) {
    staticData.workflowCache = {}
  }
  
  const getWorkflowInfo = async (workflowId: string) => {
    if (!staticData.workflowCache[workflowId]) {
      // Cache workflow information for faster subsequent calls
      staticData.workflowCache[workflowId] = {
        id: workflowId,
        lastAccessed: Date.now(),
        executionCount: 0
      }
    }
    
    staticData.workflowCache[workflowId].lastAccessed = Date.now()
    staticData.workflowCache[workflowId].executionCount++
    
    return staticData.workflowCache[workflowId]
  }
  
  const workflowId = this.getNodeParameter('workflowId', 0) as string
  const workflowInfo = await getWorkflowInfo(workflowId)
  
  const results = []
  
  for (const item of items) {
    const subWorkflowResults = await this.executeWorkflow(
      { id: workflowId },
      [item]
    )
    
    results.push({
      json: {
        ...item.json,
        results: subWorkflowResults[0]?.map(r => r.json) || [],
        workflowInfo
      }
    })
  }
  
  return [results]
}
```

## Best Practices

1. **Handle errors gracefully** with proper try-catch blocks
2. **Implement retry logic** for transient failures
3. **Use appropriate timeouts** to prevent hanging executions
4. **Monitor sub-workflow performance** and resource usage
5. **Cache workflow metadata** when executing the same workflow repeatedly
6. **Implement circuit breaker patterns** for unreliable sub-workflows
7. **Use meaningful error messages** for debugging
8. **Consider workflow versioning** for production environments

## Common Use Cases

### Data Processing Pipeline

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const dataProcessingWorkflowId = this.getNodeParameter('dataProcessingWorkflowId', 0) as string
  
  const results = []
  
  for (const item of items) {
    // Execute data processing workflow
    const processedResults = await this.executeWorkflow(
      { id: dataProcessingWorkflowId },
      [item]
    )
    
    results.push({
      json: {
        originalData: item.json,
        processedData: processedResults[0]?.map(r => r.json) || [],
        processingTimestamp: new Date().toISOString()
      }
    })
  }
  
  return [results]
}
```

### Microservice Orchestration

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Define microservice workflows
  const services = {
    userService: this.getNodeParameter('userServiceWorkflowId', 0) as string,
    paymentService: this.getNodeParameter('paymentServiceWorkflowId', 0) as string,
    notificationService: this.getNodeParameter('notificationServiceWorkflowId', 0) as string
  }
  
  const results = []
  
  for (const item of items) {
    const serviceResults = {}
    
    // Call each microservice
    for (const [serviceName, workflowId] of Object.entries(services)) {
      try {
        const serviceResult = await this.executeWorkflow(
          { id: workflowId },
          [item]
        )
        
        serviceResults[serviceName] = {
          success: true,
          data: serviceResult[0]?.map(r => r.json) || []
        }
      } catch (error) {
        serviceResults[serviceName] = {
          success: false,
          error: error.message
        }
      }
    }
    
    results.push({
      json: {
        originalData: item.json,
        serviceResults,
        allServicesSuccessful: Object.values(serviceResults).every((r: any) => r.success)
      }
    })
  }
  
  return [results]
}
```

## Related Documentation

- [getWorkflow](./getWorkflow.md) - For accessing workflow information
- [getWorkflowStaticData](./getWorkflowStaticData.md) - For persistent workflow data
- [putExecutionToWait](./putExecutionToWait.md) - For pausing executions
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
- [Error Handling](../../advanced/ErrorHandling.md) - Advanced error handling patterns
