---
title: getWorkflow
description: Access workflow information and metadata during node execution
---

# getWorkflow

The `getWorkflow` function provides access to the current workflow's information and metadata during node execution. This allows nodes to access workflow-level data, settings, and configuration that may be needed for processing.

## When to Use

Use `getWorkflow` when your node needs to:
- Access workflow metadata and properties
- Get workflow ID, name, or other identifying information
- Access workflow-level settings or configuration
- Implement workflow-aware logic
- Log or track workflow execution information

## Function Signature

```typescript
getWorkflow(): Workflow
```

## Return Value

Returns a `Workflow` object containing:
- **id**: Workflow identifier
- **name**: Workflow name
- **nodes**: Array of workflow nodes
- **connections**: Node connections configuration
- **settings**: Workflow settings and configuration
- **staticData**: Workflow static data
- **meta**: Additional workflow metadata

## Basic Usage

### Accessing Workflow Information

```typescript
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        workflowInfo: {
          id: workflow.id,
          name: workflow.name,
          nodeCount: workflow.nodes.length
        }
      }
    })
  }
  
  return [results]
}
```

### Workflow-Based Conditional Logic

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  // Different behavior based on workflow name
  const isProductionWorkflow = workflow.name?.includes('Production')
  const isTestWorkflow = workflow.name?.includes('Test')
  
  const results = []
  
  for (const item of items) {
    let processedItem = { ...item.json }
    
    if (isProductionWorkflow) {
      // Production-specific processing
      processedItem.environment = 'production'
      processedItem.logLevel = 'error'
    } else if (isTestWorkflow) {
      // Test-specific processing
      processedItem.environment = 'test'
      processedItem.logLevel = 'debug'
    } else {
      // Development processing
      processedItem.environment = 'development'
      processedItem.logLevel = 'verbose'
    }
    
    results.push({ json: processedItem })
  }
  
  return [results]
}
```

## Advanced Usage

### Analyzing Workflow Structure

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  // Analyze workflow structure
  const nodeTypes = workflow.nodes.map(node => node.type)
  const uniqueNodeTypes = [...new Set(nodeTypes)]
  
  // Find specific node types
  const httpNodes = workflow.nodes.filter(node => node.type === 'n8n-nodes-base.httpRequest')
  const webhookNodes = workflow.nodes.filter(node => node.type === 'n8n-nodes-base.webhook')
  
  // Analyze connections
  const connectionCount = Object.keys(workflow.connections).length
  
  const workflowAnalysis = {
    totalNodes: workflow.nodes.length,
    uniqueNodeTypes: uniqueNodeTypes.length,
    nodeTypes: uniqueNodeTypes,
    httpRequestCount: httpNodes.length,
    webhookCount: webhookNodes.length,
    connectionCount
  }
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        workflowAnalysis
      }
    })
  }
  
  return [results]
}
```

### Workflow Settings Access

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  // Access workflow settings
  const settings = workflow.settings || {}
  
  // Common workflow settings
  const timezone = settings.timezone || 'UTC'
  const saveDataErrorExecution = settings.saveDataErrorExecution !== false
  const saveDataSuccessExecution = settings.saveDataSuccessExecution !== false
  const executionTimeout = settings.executionTimeout || 0
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        workflowSettings: {
          timezone,
          saveDataErrorExecution,
          saveDataSuccessExecution,
          executionTimeout
        }
      }
    })
  }
  
  return [results]
}
```

### Node Relationship Analysis

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  const currentNodeName = this.getNode().name
  
  // Find current node in workflow
  const currentNode = workflow.nodes.find(node => node.name === currentNodeName)
  
  // Analyze node connections
  const connections = workflow.connections
  const nodeConnections = connections[currentNodeName] || {}
  
  // Find predecessor nodes
  const predecessors = []
  for (const [nodeName, nodeConnections] of Object.entries(connections)) {
    const outputs = nodeConnections.main || []
    for (const outputConnections of outputs) {
      if (outputConnections?.some(conn => conn.node === currentNodeName)) {
        predecessors.push(nodeName)
      }
    }
  }
  
  // Find successor nodes
  const successors = []
  const mainOutputs = nodeConnections.main || []
  for (const outputConnections of mainOutputs) {
    if (outputConnections) {
      successors.push(...outputConnections.map(conn => conn.node))
    }
  }
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        nodeRelationships: {
          currentNode: currentNodeName,
          predecessors,
          successors,
          isFirstNode: predecessors.length === 0,
          isLastNode: successors.length === 0
        }
      }
    })
  }
  
  return [results]
}
```

## Workflow Metadata Patterns

### Workflow Tagging and Classification

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  // Extract tags from workflow name or metadata
  const workflowName = workflow.name || ''
  const tags = []
  
  // Extract tags from name patterns
  if (workflowName.includes('[PROD]')) tags.push('production')
  if (workflowName.includes('[TEST]')) tags.push('test')
  if (workflowName.includes('[DEV]')) tags.push('development')
  
  // Classify by node types
  const nodeTypes = workflow.nodes.map(node => node.type)
  if (nodeTypes.some(type => type.includes('webhook'))) tags.push('webhook-triggered')
  if (nodeTypes.some(type => type.includes('cron'))) tags.push('scheduled')
  if (nodeTypes.some(type => type.includes('http'))) tags.push('api-integration')
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        workflowClassification: {
          name: workflowName,
          tags,
          category: tags.includes('production') ? 'production' : 'development'
        }
      }
    })
  }
  
  return [results]
}
```

### Workflow Complexity Analysis

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  // Calculate workflow complexity metrics
  const nodeCount = workflow.nodes.length
  const connectionCount = Object.values(workflow.connections).reduce((total, nodeConns) => {
    const mainConns = nodeConns.main || []
    return total + mainConns.reduce((sum, conns) => sum + (conns?.length || 0), 0)
  }, 0)
  
  // Analyze node type diversity
  const nodeTypes = workflow.nodes.map(node => node.type)
  const uniqueNodeTypes = new Set(nodeTypes)
  const typeComplexity = uniqueNodeTypes.size / nodeCount
  
  // Calculate branching factor
  const branchingNodes = workflow.nodes.filter(node => {
    const connections = workflow.connections[node.name]?.main || []
    return connections.some(conns => conns && conns.length > 1)
  })
  
  const complexityScore = {
    nodeCount,
    connectionCount,
    uniqueNodeTypes: uniqueNodeTypes.size,
    typeComplexity: Math.round(typeComplexity * 100) / 100,
    branchingNodes: branchingNodes.length,
    complexity: nodeCount < 5 ? 'simple' : nodeCount < 15 ? 'moderate' : 'complex'
  }
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        workflowComplexity: complexityScore
      }
    })
  }
  
  return [results]
}
```

### Workflow Validation

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  const validationResults = {
    isValid: true,
    warnings: [],
    errors: []
  }
  
  // Validate workflow structure
  if (!workflow.name || workflow.name.trim().length === 0) {
    validationResults.warnings.push('Workflow has no name')
  }
  
  if (workflow.nodes.length === 0) {
    validationResults.errors.push('Workflow has no nodes')
    validationResults.isValid = false
  }
  
  // Check for orphaned nodes
  const connectedNodes = new Set()
  Object.values(workflow.connections).forEach(nodeConns => {
    const mainConns = nodeConns.main || []
    mainConns.forEach(conns => {
      conns?.forEach(conn => connectedNodes.add(conn.node))
    })
  })
  
  const orphanedNodes = workflow.nodes.filter(node => 
    !connectedNodes.has(node.name) && 
    !Object.keys(workflow.connections).includes(node.name)
  )
  
  if (orphanedNodes.length > 0) {
    validationResults.warnings.push(`Found ${orphanedNodes.length} orphaned nodes`)
  }
  
  // Check for missing required parameters
  const nodesWithMissingParams = workflow.nodes.filter(node => {
    // This would need to be customized based on node type requirements
    return false // Placeholder
  })
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        workflowValidation: validationResults
      }
    })
  }
  
  return [results]
}
```

## Performance Considerations

### Caching Workflow Information

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  
  // Cache workflow info to avoid repeated calls
  if (!this._workflowCache) {
    const workflow = this.getWorkflow()
    this._workflowCache = {
      id: workflow.id,
      name: workflow.name,
      nodeCount: workflow.nodes.length,
      settings: workflow.settings || {}
    }
  }
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        workflowInfo: this._workflowCache
      }
    })
  }
  
  return [results]
}
```

### Selective Workflow Data Access

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  // Only extract needed information to minimize memory usage
  const workflowSummary = {
    id: workflow.id,
    name: workflow.name,
    nodeCount: workflow.nodes.length,
    // Don't include full nodes array or connections for large workflows
    hasWebhooks: workflow.nodes.some(node => node.type.includes('webhook')),
    hasSchedule: workflow.nodes.some(node => node.type.includes('cron'))
  }
  
  const results = []
  
  for (const item of items) {
    results.push({
      json: {
        ...item.json,
        workflow: workflowSummary
      }
    })
  }
  
  return [results]
}
```

## Best Practices

1. **Cache workflow information** when processing multiple items
2. **Extract only needed data** to minimize memory usage
3. **Validate workflow structure** before relying on it
4. **Handle missing workflow data** gracefully
5. **Use workflow metadata** for environment-specific logic
6. **Document workflow dependencies** in your node
7. **Consider workflow complexity** when implementing features

## Common Use Cases

### Environment Detection

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  // Detect environment from workflow name or settings
  const workflowName = workflow.name?.toLowerCase() || ''
  const environment = workflowName.includes('prod') ? 'production' :
                     workflowName.includes('test') ? 'test' : 'development'
  
  // Adjust behavior based on environment
  const config = {
    logLevel: environment === 'production' ? 'error' : 'debug',
    enableMetrics: environment === 'production',
    timeout: environment === 'production' ? 30000 : 60000
  }
  
  return [items]
}
```

### Workflow Documentation

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const workflow = this.getWorkflow()
  
  // Generate workflow documentation
  const documentation = {
    name: workflow.name,
    description: workflow.meta?.description || 'No description provided',
    nodes: workflow.nodes.map(node => ({
      name: node.name,
      type: node.type,
      position: node.position
    })),
    complexity: workflow.nodes.length < 10 ? 'Simple' : 'Complex',
    lastModified: workflow.meta?.lastModified || 'Unknown'
  }
  
  return [{
    json: {
      workflowDocumentation: documentation
    }
  }]
}
```

## Related Documentation

- [getWorkflowStaticData](./getWorkflowStaticData.md) - For accessing workflow static data
- [executeWorkflow](./executeWorkflow.md) - For executing sub-workflows
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
- [Base Helpers](../helpers/base.md) - Core helper functions
