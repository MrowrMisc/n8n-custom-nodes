# ITriggerFunctions

The execution context for event-driven trigger nodes that respond to external events in real-time. This interface is used when your trigger node needs to listen for webhooks, WebSocket connections, or other real-time event sources.

## When to Use

Use `ITriggerFunctions` when:
- Creating webhook receivers
- Building WebSocket listeners
- Implementing real-time event handlers
- Creating nodes that respond to external notifications

## Interface Definition

```ts
interface ITriggerFunctions extends IExecuteFunctions {
  emit(data: INodeExecutionData[][]): void;
  emitError(error: Error, responseData?: IDataObject): void;
  getMode(): WorkflowExecuteMode;
  getActivationMode(): WorkflowActivateMode;
  helpers: ITriggerFunctionsHelpers;
}
```

## Core Methods

### emit()

Emits data when an event is received.

```ts
emit(data: INodeExecutionData[][]): void
```

**Parameters:**
- `data` - Array of execution data arrays to emit

### emitError()

Emits an error when event processing fails.

```ts
emitError(error: Error, responseData?: IDataObject): void
```

**Parameters:**
- `error` - The error that occurred
- `responseData` - Optional additional error context

### getMode()

Returns the current workflow execution mode.

```ts
getMode(): WorkflowExecuteMode
```

**Returns:** The execution mode ('trigger', 'manual', etc.)

### getActivationMode()

Returns how the workflow was activated.

```ts
getActivationMode(): WorkflowActivateMode
```

**Returns:** The activation mode ('init', 'create', 'update', etc.)

## Implementation Example

```ts
import {
  ITriggerFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  ITriggerResponse,
  NodeOperationError,
} from 'n8n-workflow';
import { createServer, IncomingMessage, ServerResponse } from 'http';

export class WebhookTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Webhook Trigger',
    name: 'webhookTrigger',
    icon: 'fa:satellite-dish',
    group: ['trigger'],
    version: 1,
    description: 'Receives webhook events',
    defaults: {
      name: 'Webhook Trigger',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: '/webhook',
        required: true,
        description: 'Webhook endpoint path',
      },
      {
        displayName: 'HTTP Method',
        name: 'httpMethod',
        type: 'options',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
        ],
        default: 'POST',
        description: 'HTTP method to listen for',
      },
      {
        displayName: 'Response Code',
        name: 'responseCode',
        type: 'number',
        default: 200,
        description: 'HTTP response code to return',
      },
      {
        displayName: 'Response Data',
        name: 'responseData',
        type: 'string',
        default: 'OK',
        description: 'Response body to return',
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const path = this.getNodeParameter('path', 0) as string;
    const httpMethod = this.getNodeParameter('httpMethod', 0) as string;
    const responseCode = this.getNodeParameter('responseCode', 0) as number;
    const responseData = this.getNodeParameter('responseData', 0) as string;

    let server: any;

    const startServer = () => {
      return new Promise<void>((resolve, reject) => {
        server = createServer((req: IncomingMessage, res: ServerResponse) => {
          // Check if this is the correct path and method
          if (req.url !== path || req.method !== httpMethod) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }

          // Parse request body
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', () => {
            try {
              // Process the webhook data
              const webhookData = this.processWebhookData(req, body);
              
              // Emit the data
              this.emit([webhookData]);

              // Send response
              res.writeHead(responseCode, { 'Content-Type': 'text/plain' });
              res.end(responseData);
            } catch (error) {
              // Emit error
              this.emitError(error, { path, method: httpMethod });
              
              // Send error response
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Internal Server Error');
            }
          });
        });

        server.listen(0, () => {
          const port = server.address()?.port;
          console.log(`Webhook server listening on port ${port}`);
          resolve();
        });

        server.on('error', reject);
      });
    };

    const stopServer = () => {
      return new Promise<void>((resolve) => {
        if (server) {
          server.close(() => {
            console.log('Webhook server stopped');
            resolve();
          });
        } else {
          resolve();
        }
      });
    };

    // Start the server
    await startServer();

    return {
      closeFunction: stopServer,
      manualTriggerFunction: async () => {
        // Manual trigger for testing
        const testData: INodeExecutionData[] = [{
          json: {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Manual trigger test',
          },
        }];
        
        return [testData];
      },
    };
  }

  private processWebhookData(req: IncomingMessage, body: string): INodeExecutionData[] {
    let parsedBody: any;
    
    try {
      // Try to parse as JSON
      parsedBody = JSON.parse(body);
    } catch {
      // If not JSON, use as string
      parsedBody = body;
    }

    return [{
      json: {
        headers: req.headers,
        method: req.method,
        url: req.url,
        body: parsedBody,
        timestamp: new Date().toISOString(),
      },
    }];
  }
}
```

## Common Patterns

### WebSocket Trigger

```ts
import WebSocket from 'ws';

async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const wsUrl = this.getNodeParameter('wsUrl', 0) as string;
  let ws: WebSocket;

  const startWebSocket = () => {
    return new Promise<void>((resolve, reject) => {
      ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        console.log('WebSocket connected');
        resolve();
      });

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          const executionData: INodeExecutionData[] = [{
            json: {
              ...message,
              timestamp: new Date().toISOString(),
            },
          }];

          this.emit([executionData]);
        } catch (error) {
          this.emitError(error, { wsUrl });
        }
      });

      ws.on('error', (error) => {
        this.emitError(error, { wsUrl });
        reject(error);
      });

      ws.on('close', () => {
        console.log('WebSocket disconnected');
      });
    });
  };

  const stopWebSocket = () => {
    return new Promise<void>((resolve) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      resolve();
    });
  };

  await startWebSocket();

  return {
    closeFunction: stopWebSocket,
  };
}
```

### File Watcher Trigger

```ts
import { watch, FSWatcher } from 'chokidar';

async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const watchPath = this.getNodeParameter('watchPath', 0) as string;
  const events = this.getNodeParameter('events', 0) as string[];
  
  let watcher: FSWatcher;

  const startWatcher = () => {
    return new Promise<void>((resolve) => {
      watcher = watch(watchPath, {
        persistent: true,
        ignoreInitial: true,
      });

      // Handle different file events
      if (events.includes('add')) {
        watcher.on('add', (path) => {
          this.emitFileEvent('add', path);
        });
      }

      if (events.includes('change')) {
        watcher.on('change', (path) => {
          this.emitFileEvent('change', path);
        });
      }

      if (events.includes('unlink')) {
        watcher.on('unlink', (path) => {
          this.emitFileEvent('unlink', path);
        });
      }

      watcher.on('ready', () => {
        console.log('File watcher ready');
        resolve();
      });

      watcher.on('error', (error) => {
        this.emitError(error, { watchPath });
      });
    });
  };

  const stopWatcher = () => {
    return new Promise<void>((resolve) => {
      if (watcher) {
        watcher.close().then(() => {
          console.log('File watcher stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  await startWatcher();

  return {
    closeFunction: stopWatcher,
  };
}

private emitFileEvent(event: string, filePath: string): void {
  const executionData: INodeExecutionData[] = [{
    json: {
      event,
      path: filePath,
      timestamp: new Date().toISOString(),
    },
  }];

  this.emit([executionData]);
}
```

### Server-Sent Events (SSE) Trigger

```ts
import EventSource from 'eventsource';

async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const sseUrl = this.getNodeParameter('sseUrl', 0) as string;
  const eventTypes = this.getNodeParameter('eventTypes', 0) as string[];
  
  let eventSource: EventSource;

  const startSSE = () => {
    return new Promise<void>((resolve, reject) => {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        resolve();
      };

      eventSource.onerror = (error) => {
        this.emitError(new Error('SSE connection error'), { sseUrl });
        reject(error);
      };

      // Listen for specific event types
      eventTypes.forEach(eventType => {
        eventSource.addEventListener(eventType, (event) => {
          try {
            const data = JSON.parse(event.data);
            
            const executionData: INodeExecutionData[] = [{
              json: {
                eventType,
                data,
                id: event.lastEventId,
                timestamp: new Date().toISOString(),
              },
            }];

            this.emit([executionData]);
          } catch (error) {
            this.emitError(error, { eventType, sseUrl });
          }
        });
      });

      // Listen for generic messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          const executionData: INodeExecutionData[] = [{
            json: {
              eventType: 'message',
              data,
              id: event.lastEventId,
              timestamp: new Date().toISOString(),
            },
          }];

          this.emit([executionData]);
        } catch (error) {
          this.emitError(error, { sseUrl });
        }
      };
    });
  };

  const stopSSE = () => {
    return new Promise<void>((resolve) => {
      if (eventSource) {
        eventSource.close();
        console.log('SSE connection closed');
      }
      resolve();
    });
  };

  await startSSE();

  return {
    closeFunction: stopSSE,
  };
}
```

### Database Change Stream Trigger

```ts
async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const connectionString = this.getNodeParameter('connectionString', 0) as string;
  const collection = this.getNodeParameter('collection', 0) as string;
  const operations = this.getNodeParameter('operations', 0) as string[];
  
  let changeStream: any;
  let client: any;

  const startChangeStream = async () => {
    // Connect to database
    client = await this.helpers.dbConnect(connectionString);
    const db = client.db();
    const coll = db.collection(collection);

    // Create change stream
    const pipeline = [
      {
        $match: {
          operationType: { $in: operations }
        }
      }
    ];

    changeStream = coll.watch(pipeline);

    changeStream.on('change', (change: any) => {
      try {
        const executionData: INodeExecutionData[] = [{
          json: {
            operationType: change.operationType,
            documentKey: change.documentKey,
            fullDocument: change.fullDocument,
            updateDescription: change.updateDescription,
            timestamp: new Date().toISOString(),
          },
        }];

        this.emit([executionData]);
      } catch (error) {
        this.emitError(error, { collection });
      }
    });

    changeStream.on('error', (error: Error) => {
      this.emitError(error, { collection });
    });
  };

  const stopChangeStream = async () => {
    if (changeStream) {
      await changeStream.close();
      console.log('Change stream closed');
    }
    
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  };

  await startChangeStream();

  return {
    closeFunction: stopChangeStream,
  };
}
```

## Error Handling

### Graceful Error Recovery

```ts
async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const maxRetries = 3;
  let retryCount = 0;
  let connection: any;

  const startConnection = async (): Promise<void> => {
    try {
      connection = await this.establishConnection();
      retryCount = 0; // Reset on successful connection
      
      connection.on('data', (data: any) => {
        try {
          this.processData(data);
        } catch (error) {
          this.emitError(error, { data });
        }
      });

      connection.on('error', async (error: Error) => {
        this.emitError(error);
        
        // Attempt reconnection
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          
          setTimeout(async () => {
            try {
              await startConnection();
            } catch (reconnectError) {
              this.emitError(reconnectError);
            }
          }, delay);
        }
      });

      connection.on('close', () => {
        console.log('Connection closed');
      });
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        
        setTimeout(() => startConnection(), delay);
      } else {
        throw error;
      }
    }
  };

  const stopConnection = async () => {
    if (connection) {
      connection.close();
    }
  };

  await startConnection();

  return {
    closeFunction: stopConnection,
  };
}
```

### Circuit Breaker Pattern

```ts
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private maxFailures = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.maxFailures) {
      this.state = 'open';
    }
  }
}

async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const circuitBreaker = new CircuitBreaker();
  
  const processEvent = async (data: any) => {
    try {
      await circuitBreaker.execute(async () => {
        // Process the event
        const executionData = this.transformData(data);
        this.emit([executionData]);
      });
    } catch (error) {
      this.emitError(error, { circuitBreakerState: circuitBreaker.state });
    }
  };

  // ... rest of trigger setup
}
```

## Performance Optimization

### Batching Events

```ts
async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const batchSize = this.getNodeParameter('batchSize', 0, 10) as number;
  const batchTimeout = this.getNodeParameter('batchTimeout', 0, 5000) as number;
  
  let eventBatch: INodeExecutionData[] = [];
  let batchTimer: NodeJS.Timeout;

  const flushBatch = () => {
    if (eventBatch.length > 0) {
      this.emit([eventBatch]);
      eventBatch = [];
    }
    
    if (batchTimer) {
      clearTimeout(batchTimer);
    }
  };

  const addToBatch = (data: INodeExecutionData) => {
    eventBatch.push(data);
    
    // Flush if batch is full
    if (eventBatch.length >= batchSize) {
      flushBatch();
      return;
    }
    
    // Set timer for batch timeout
    if (batchTimer) {
      clearTimeout(batchTimer);
    }
    
    batchTimer = setTimeout(flushBatch, batchTimeout);
  };

  // ... event handling logic that calls addToBatch(data)

  return {
    closeFunction: async () => {
      flushBatch(); // Flush remaining events
      // ... cleanup logic
    },
  };
}
```

### Memory Management

```ts
async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const maxQueueSize = 1000;
  const eventQueue: INodeExecutionData[] = [];
  let processing = false;

  const processQueue = async () => {
    if (processing || eventQueue.length === 0) {
      return;
    }

    processing = true;
    
    try {
      // Process events in batches
      const batchSize = Math.min(100, eventQueue.length);
      const batch = eventQueue.splice(0, batchSize);
      
      this.emit([batch]);
    } catch (error) {
      this.emitError(error);
    } finally {
      processing = false;
      
      // Continue processing if more events are queued
      if (eventQueue.length > 0) {
        setImmediate(processQueue);
      }
    }
  };

  const addEvent = (data: INodeExecutionData) => {
    // Prevent memory overflow
    if (eventQueue.length >= maxQueueSize) {
      // Drop oldest events
      eventQueue.shift();
    }
    
    eventQueue.push(data);
    
    // Start processing
    setImmediate(processQueue);
  };

  // ... event handling logic that calls addEvent(data)
}
```

## Best Practices

### 1. Always Implement Cleanup

```ts
async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  const resources: any[] = [];

  try {
    // Setup resources
    const server = await this.startServer();
    const connection = await this.openConnection();
    
    resources.push(server, connection);

    // ... trigger logic

    return {
      closeFunction: async () => {
        // Clean up all resources
        for (const resource of resources) {
          try {
            if (resource.close) {
              await resource.close();
            } else if (resource.destroy) {
              resource.destroy();
            }
          } catch (error) {
            console.error('Error cleaning up resource:', error);
          }
        }
      },
    };
  } catch (error) {
    // Clean up on setup failure
    for (const resource of resources) {
      try {
        if (resource.close) {
          await resource.close();
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
    throw error;
  }
}
```

### 2. Handle Manual Triggers

```ts
async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
  // ... setup logic

  return {
    closeFunction: stopTrigger,
    manualTriggerFunction: async () => {
      // Provide test data for manual execution
      const testData: INodeExecutionData[] = [{
        json: {
          test: true,
          timestamp: new Date().toISOString(),
          message: 'Manual trigger executed',
        },
      }];
      
      return [testData];
    },
  };
}
```

### 3. Use Type Safety

```ts
interface WebhookPayload {
  id: string;
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

private processWebhookData(payload: unknown): INodeExecutionData[] {
  // Validate payload structure
  if (!this.isValidWebhookPayload(payload)) {
    throw new Error('Invalid webhook payload structure');
  }

  const typedPayload = payload as WebhookPayload;

  return [{
    json: {
      id: typedPayload.id,
      event: typedPayload.event,
      data: typedPayload.data,
      receivedAt: new Date().toISOString(),
      originalTimestamp: typedPayload.timestamp,
    },
  }];
}

private isValidWebhookPayload(payload: unknown): payload is WebhookPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'id' in payload &&
    'event' in payload &&
    'data' in payload &&
    'timestamp' in payload
  );
}
```

## See Also

- **[IPollFunctions](./IPollFunctions)** - Polling-based triggers
- **[IExecuteFunctions](./IExecuteFunctions)** - Main execution context
- **[getWorkflowStaticData](../workflow/getWorkflowStaticData)** - Managing persistent state
- **[HTTP Helpers](../helpers/http)** - Making HTTP requests
