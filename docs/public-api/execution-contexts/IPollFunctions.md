# IPollFunctions

The execution context for polling trigger nodes that periodically check for new data. This interface is used when your trigger node needs to regularly poll an external service for changes or new items.

## When to Use

Use `IPollFunctions` when:
- Creating trigger nodes that poll APIs for new data
- Implementing scheduled data fetching
- Building nodes that check for file system changes
- Creating nodes that monitor external resources periodically

## Interface Definition

```ts
interface IPollFunctions extends IExecuteFunctions {
  getMode(): WorkflowExecuteMode;
  getActivationMode(): WorkflowActivateMode;
  __emit(data: INodeExecutionData[][]): void;
  __emitError(error: Error, responseData?: IDataObject): void;
  helpers: IPollFunctionsHelpers;
}
```

## Core Methods

### __emit()

Emits data when new items are found during polling.

```ts
__emit(data: INodeExecutionData[][]): void
```

**Parameters:**
- `data` - Array of execution data arrays to emit

### __emitError()

Emits an error when polling fails.

```ts
__emitError(error: Error, responseData?: IDataObject): void
```

**Parameters:**
- `error` - The error that occurred
- `responseData` - Optional additional error context

### getMode()

Returns the current workflow execution mode.

```ts
getMode(): WorkflowExecuteMode
```

**Returns:** The execution mode ('poll', 'trigger', 'manual', etc.)

### getActivationMode()

Returns how the workflow was activated.

```ts
getActivationMode(): WorkflowActivateMode
```

**Returns:** The activation mode ('init', 'create', 'update', etc.)

## Implementation Example

```ts
import {
  IPollFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class ApiPollerTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'API Poller',
    name: 'apiPoller',
    icon: 'fa:clock',
    group: ['trigger'],
    version: 1,
    description: 'Polls an API for new data',
    defaults: {
      name: 'API Poller',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'apiCredentials',
        required: true,
      },
    ],
    polling: true,
    properties: [
      {
        displayName: 'Endpoint',
        name: 'endpoint',
        type: 'string',
        default: '',
        required: true,
        description: 'API endpoint to poll',
      },
      {
        displayName: 'Poll Interval',
        name: 'pollInterval',
        type: 'number',
        default: 60,
        description: 'How often to poll in seconds',
      },
      {
        displayName: 'Date Field',
        name: 'dateField',
        type: 'string',
        default: 'created_at',
        description: 'Field to use for tracking new items',
      },
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const endpoint = this.getNodeParameter('endpoint', 0) as string;
    const dateField = this.getNodeParameter('dateField', 0) as string;
    
    try {
      // Get the last poll time from workflow static data
      const workflowStaticData = this.getWorkflowStaticData('node');
      const lastPollTime = workflowStaticData.lastPollTime as string;
      
      // Build query parameters
      const qs: any = {};
      if (lastPollTime) {
        qs.since = lastPollTime;
      }

      // Make the API request
      const response = await this.helpers.httpRequestWithAuthentication(
        'apiCredentials',
        {
          method: 'GET',
          url: endpoint,
          qs,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      // Process the response
      const items = response.data || response.items || response;
      
      if (!Array.isArray(items) || items.length === 0) {
        return null; // No new data
      }

      // Filter for new items
      const newItems = this.filterNewItems(items, lastPollTime, dateField);
      
      if (newItems.length === 0) {
        return null; // No new items
      }

      // Update the last poll time
      const latestItem = newItems[0];
      const latestTimestamp = latestItem[dateField];
      if (latestTimestamp) {
        workflowStaticData.lastPollTime = latestTimestamp;
      }

      // Convert to execution data
      const executionData: INodeExecutionData[] = newItems.map(item => ({
        json: item,
      }));

      return [executionData];
    } catch (error) {
      if (this.getMode() === 'manual') {
        // In manual mode, throw the error to show in UI
        throw new NodeOperationError(
          this.getNode(),
          `Failed to poll API: ${error.message}`
        );
      } else {
        // In automatic mode, emit error but don't stop polling
        this.__emitError(error, { endpoint });
        return null;
      }
    }
  }

  private filterNewItems(items: any[], lastPollTime: string | undefined, dateField: string): any[] {
    if (!lastPollTime) {
      // First poll - return all items
      return items;
    }

    const lastPollDate = new Date(lastPollTime);
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate > lastPollDate;
    });
  }
}
```

## Common Patterns

### Database Polling

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const tableName = this.getNodeParameter('tableName', 0) as string;
  const workflowStaticData = this.getWorkflowStaticData('node');
  
  try {
    // Get last processed ID
    const lastId = workflowStaticData.lastId as number || 0;
    
    // Query for new records
    const query = `
      SELECT * FROM ${tableName} 
      WHERE id > ? 
      ORDER BY id ASC 
      LIMIT 100
    `;
    
    const records = await this.helpers.dbQuery(query, [lastId]);
    
    if (records.length === 0) {
      return null;
    }
    
    // Update last processed ID
    const lastRecord = records[records.length - 1];
    workflowStaticData.lastId = lastRecord.id;
    
    // Convert to execution data
    const executionData: INodeExecutionData[] = records.map(record => ({
      json: record,
    }));
    
    return [executionData];
  } catch (error) {
    this.__emitError(error, { table: tableName });
    return null;
  }
}
```

### File System Polling

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const watchPath = this.getNodeParameter('watchPath', 0) as string;
  const workflowStaticData = this.getWorkflowStaticData('node');
  
  try {
    // Get list of files
    const files = await this.helpers.listFiles(watchPath);
    
    // Get previously seen files
    const seenFiles = new Set(workflowStaticData.seenFiles as string[] || []);
    
    // Find new files
    const newFiles = files.filter(file => !seenFiles.has(file.path));
    
    if (newFiles.length === 0) {
      return null;
    }
    
    // Update seen files
    workflowStaticData.seenFiles = files.map(f => f.path);
    
    // Process new files
    const executionData: INodeExecutionData[] = [];
    
    for (const file of newFiles) {
      const fileData = await this.helpers.readFile(file.path);
      
      executionData.push({
        json: {
          fileName: file.name,
          filePath: file.path,
          size: file.size,
          modified: file.modified,
        },
        binary: {
          data: await this.helpers.prepareBinaryData(
            fileData,
            file.name
          ),
        },
      });
    }
    
    return [executionData];
  } catch (error) {
    this.__emitError(error, { watchPath });
    return null;
  }
}
```

### RSS Feed Polling

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const feedUrl = this.getNodeParameter('feedUrl', 0) as string;
  const workflowStaticData = this.getWorkflowStaticData('node');
  
  try {
    // Fetch RSS feed
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: feedUrl,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
    
    // Parse RSS feed
    const feed = await this.helpers.parseXml(response);
    const items = feed.rss.channel.item || [];
    
    // Get last seen GUID
    const lastGuid = workflowStaticData.lastGuid as string;
    
    // Find new items
    const newItems = [];
    for (const item of items) {
      if (item.guid === lastGuid) {
        break; // Found last seen item, stop here
      }
      newItems.push(item);
    }
    
    if (newItems.length === 0) {
      return null;
    }
    
    // Update last seen GUID
    if (newItems.length > 0) {
      workflowStaticData.lastGuid = newItems[0].guid;
    }
    
    // Convert to execution data
    const executionData: INodeExecutionData[] = newItems.map(item => ({
      json: {
        title: item.title,
        description: item.description,
        link: item.link,
        pubDate: item.pubDate,
        guid: item.guid,
      },
    }));
    
    return [executionData];
  } catch (error) {
    this.__emitError(error, { feedUrl });
    return null;
  }
}
```

### Webhook Status Polling

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const webhookUrl = this.getNodeParameter('webhookUrl', 0) as string;
  const workflowStaticData = this.getWorkflowStaticData('node');
  
  try {
    // Check webhook deliveries
    const response = await this.helpers.httpRequestWithAuthentication(
      'webhookCredentials',
      {
        method: 'GET',
        url: `${webhookUrl}/deliveries`,
        qs: {
          per_page: 50,
          since: workflowStaticData.lastDeliveryId || '',
        },
      }
    );
    
    const deliveries = response.deliveries || [];
    
    if (deliveries.length === 0) {
      return null;
    }
    
    // Filter for failed deliveries
    const failedDeliveries = deliveries.filter(
      (delivery: any) => delivery.status !== 'success'
    );
    
    if (failedDeliveries.length === 0) {
      // Update last delivery ID even if no failures
      workflowStaticData.lastDeliveryId = deliveries[0].id;
      return null;
    }
    
    // Update last delivery ID
    workflowStaticData.lastDeliveryId = deliveries[0].id;
    
    // Convert to execution data
    const executionData: INodeExecutionData[] = failedDeliveries.map(delivery => ({
      json: {
        id: delivery.id,
        status: delivery.status,
        error: delivery.error,
        timestamp: delivery.timestamp,
        payload: delivery.payload,
      },
    }));
    
    return [executionData];
  } catch (error) {
    this.__emitError(error, { webhookUrl });
    return null;
  }
}
```

## State Management

### Using Workflow Static Data

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  // Get persistent state
  const workflowStaticData = this.getWorkflowStaticData('node');
  
  // Initialize state if needed
  if (!workflowStaticData.initialized) {
    workflowStaticData.initialized = true;
    workflowStaticData.lastPollTime = new Date().toISOString();
    workflowStaticData.processedItems = [];
  }
  
  // Use state in polling logic
  const lastPollTime = workflowStaticData.lastPollTime as string;
  const processedItems = workflowStaticData.processedItems as string[];
  
  // ... polling logic ...
  
  // Update state
  workflowStaticData.lastPollTime = new Date().toISOString();
  workflowStaticData.processedItems = [...processedItems, ...newItemIds];
  
  return [executionData];
}
```

### Handling State Corruption

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const workflowStaticData = this.getWorkflowStaticData('node');
  
  try {
    // Validate state
    if (!this.isValidState(workflowStaticData)) {
      // Reset corrupted state
      this.resetState(workflowStaticData);
    }
    
    // ... polling logic ...
  } catch (error) {
    // Reset state on critical errors
    if (this.isCriticalError(error)) {
      this.resetState(workflowStaticData);
    }
    
    this.__emitError(error);
    return null;
  }
}

private isValidState(state: any): boolean {
  return (
    state &&
    typeof state.lastPollTime === 'string' &&
    Array.isArray(state.processedItems)
  );
}

private resetState(state: any): void {
  state.lastPollTime = new Date().toISOString();
  state.processedItems = [];
  state.initialized = true;
}

private isCriticalError(error: any): boolean {
  return (
    error.code === 'ENOTFOUND' ||
    error.response?.status === 401 ||
    error.response?.status === 403
  );
}
```

## Error Handling

### Graceful Error Recovery

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const maxRetries = 3;
  const workflowStaticData = this.getWorkflowStaticData('node');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Polling logic
      const result = await this.performPoll();
      
      // Reset error count on success
      workflowStaticData.errorCount = 0;
      
      return result;
    } catch (error) {
      const errorCount = (workflowStaticData.errorCount as number) || 0;
      workflowStaticData.errorCount = errorCount + 1;
      
      if (attempt === maxRetries) {
        // Max retries reached
        this.__emitError(error, {
          attempt,
          totalErrors: workflowStaticData.errorCount,
        });
        
        // Exponential backoff for next poll
        workflowStaticData.backoffUntil = Date.now() + (Math.pow(2, errorCount) * 1000);
        
        return null;
      }
      
      // Wait before retry
      await this.helpers.sleep(1000 * attempt);
    }
  }
  
  return null;
}
```

### Rate Limiting Handling

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const workflowStaticData = this.getWorkflowStaticData('node');
  
  // Check if we're in backoff period
  const backoffUntil = workflowStaticData.backoffUntil as number;
  if (backoffUntil && Date.now() < backoffUntil) {
    return null; // Skip this poll
  }
  
  try {
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: 'https://api.example.com/data',
    });
    
    // Reset backoff on success
    delete workflowStaticData.backoffUntil;
    
    return this.processResponse(response);
  } catch (error) {
    if (error.response?.status === 429) {
      // Rate limited
      const retryAfter = error.response.headers['retry-after'];
      const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
      
      workflowStaticData.backoffUntil = Date.now() + backoffTime;
      
      this.__emitError(
        new Error(`Rate limited. Will retry after ${backoffTime / 1000} seconds`),
        { retryAfter: backoffTime }
      );
    } else {
      this.__emitError(error);
    }
    
    return null;
  }
}
```

## Performance Optimization

### Efficient Data Processing

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const batchSize = this.getNodeParameter('batchSize', 0, 100) as number;
  
  try {
    // Fetch data in batches
    const allItems = await this.fetchAllNewItems();
    
    if (allItems.length === 0) {
      return null;
    }
    
    // Process in batches to avoid memory issues
    const batches: INodeExecutionData[][] = [];
    
    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);
      const executionData = batch.map(item => ({ json: item }));
      batches.push(executionData);
    }
    
    // Emit each batch separately
    for (const batch of batches) {
      this.__emit([batch]);
    }
    
    return null; // Already emitted
  } catch (error) {
    this.__emitError(error);
    return null;
  }
}
```

### Memory Management

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const workflowStaticData = this.getWorkflowStaticData('node');
  
  try {
    // Limit state size to prevent memory leaks
    const processedItems = workflowStaticData.processedItems as string[] || [];
    
    // Keep only last 1000 processed items
    if (processedItems.length > 1000) {
      workflowStaticData.processedItems = processedItems.slice(-1000);
    }
    
    // Stream large responses
    const response = await this.helpers.httpRequestStream({
      method: 'GET',
      url: 'https://api.example.com/large-dataset',
    });
    
    const items = await this.processStreamResponse(response);
    
    return [items];
  } catch (error) {
    this.__emitError(error);
    return null;
  }
}
```

## Best Practices

### 1. Always Handle First Poll

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const workflowStaticData = this.getWorkflowStaticData('node');
  const isFirstPoll = !workflowStaticData.lastPollTime;
  
  if (isFirstPoll) {
    // On first poll, just set the timestamp and return
    workflowStaticData.lastPollTime = new Date().toISOString();
    return null;
  }
  
  // Normal polling logic
  return await this.performNormalPoll();
}
```

### 2. Use Proper Deduplication

```ts
private isDuplicate(item: any, processedItems: string[]): boolean {
  const itemId = item.id || item.guid || JSON.stringify(item);
  return processedItems.includes(itemId);
}

async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const workflowStaticData = this.getWorkflowStaticData('node');
  const processedItems = workflowStaticData.processedItems as string[] || [];
  
  const newItems = items.filter(item => !this.isDuplicate(item, processedItems));
  
  if (newItems.length > 0) {
    // Update processed items
    const newItemIds = newItems.map(item => item.id || item.guid || JSON.stringify(item));
    workflowStaticData.processedItems = [...processedItems, ...newItemIds];
  }
  
  return newItems.length > 0 ? [newItems.map(item => ({ json: item }))] : null;
}
```

### 3. Implement Proper Logging

```ts
async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
  const startTime = Date.now();
  
  try {
    const result = await this.performPoll();
    
    // Log successful poll
    console.log(`Poll completed in ${Date.now() - startTime}ms, found ${result?.[0]?.length || 0} items`);
    
    return result;
  } catch (error) {
    // Log error with context
    console.error(`Poll failed after ${Date.now() - startTime}ms:`, {
      error: error.message,
      node: this.getNode().name,
      workflow: this.getWorkflow().name,
    });
    
    this.__emitError(error);
    return null;
  }
}
```

## See Also

- **[IExecuteFunctions](./IExecuteFunctions)** - Main execution context
- **[ITriggerFunctions](./ITriggerFunctions)** - Event-based triggers
- **[getWorkflowStaticData](../workflow/getWorkflowStaticData)** - Managing persistent state
- **[HTTP Helpers](../helpers/http)** - Making HTTP requests
