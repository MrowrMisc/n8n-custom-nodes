# IHookFunctions

The execution context for lifecycle hook functions that execute at specific points in a workflow's lifecycle. This interface is used when your node needs to perform setup, cleanup, or monitoring operations during workflow execution.

## When to Use

Use `IHookFunctions` when:
- Performing setup operations before workflow execution
- Cleaning up resources after workflow completion
- Monitoring workflow progress and performance
- Implementing custom logging or analytics

## Interface Definition

```ts
interface IHookFunctions extends IExecuteFunctions {
  getMode(): WorkflowExecuteMode;
  getActivationMode(): WorkflowActivateMode;
  getWorkflowStaticData(type: string): IDataObject;
  helpers: IHookFunctionsHelpers;
}
```

## Core Methods

### getMode()

Returns the current workflow execution mode.

```ts
getMode(): WorkflowExecuteMode
```

**Returns:** The execution mode ('manual', 'trigger', 'webhook', etc.)

### getActivationMode()

Returns how the workflow was activated.

```ts
getActivationMode(): WorkflowActivateMode
```

**Returns:** The activation mode ('init', 'create', 'update', etc.)

### getWorkflowStaticData()

Gets persistent data that survives across workflow executions.

```ts
getWorkflowStaticData(type: string): IDataObject
```

**Parameters:**
- `type` - The type of static data ('global' or 'node')

**Returns:** Static data object

## Hook Types

### beforeExecute

Runs before the workflow starts executing.

```ts
async beforeExecute(this: IHookFunctions): Promise<void> {
  // Setup operations
}
```

### afterExecute

Runs after the workflow completes execution.

```ts
async afterExecute(this: IHookFunctions, data: IRunExecutionData): Promise<void> {
  // Cleanup operations
}
```

### onError

Runs when the workflow encounters an error.

```ts
async onError(this: IHookFunctions, error: Error): Promise<void> {
  // Error handling
}
```

## Implementation Example

```ts
import {
  IHookFunctions,
  INodeType,
  INodeTypeDescription,
  IRunExecutionData,
  NodeOperationError,
} from 'n8n-workflow';

export class WorkflowMonitor implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Workflow Monitor',
    name: 'workflowMonitor',
    icon: 'fa:chart-line',
    group: ['utility'],
    version: 1,
    description: 'Monitors workflow execution and performance',
    defaults: {
      name: 'Workflow Monitor',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Enable Performance Tracking',
        name: 'enablePerformanceTracking',
        type: 'boolean',
        default: true,
        description: 'Track execution time and performance metrics',
      },
      {
        displayName: 'Log Level',
        name: 'logLevel',
        type: 'options',
        options: [
          { name: 'Debug', value: 'debug' },
          { name: 'Info', value: 'info' },
          { name: 'Warning', value: 'warning' },
          { name: 'Error', value: 'error' },
        ],
        default: 'info',
        description: 'Minimum log level to record',
      },
      {
        displayName: 'Send Notifications',
        name: 'sendNotifications',
        type: 'boolean',
        default: false,
        description: 'Send notifications on workflow events',
      },
    ],
  };

  hooks = {
    beforeExecute: [
      async function(this: IHookFunctions): Promise<void> {
        const enablePerformanceTracking = this.getNodeParameter('enablePerformanceTracking', 0) as boolean;
        
        if (enablePerformanceTracking) {
          // Initialize performance tracking
          const staticData = this.getWorkflowStaticData('global');
          staticData.executionStartTime = Date.now();
          staticData.executionCount = (staticData.executionCount as number || 0) + 1;
          
          this.logger.info('Workflow execution started', {
            executionId: this.getExecutionId(),
            executionCount: staticData.executionCount,
            mode: this.getMode(),
          });
        }
      },
    ],

    afterExecute: [
      async function(this: IHookFunctions, data: IRunExecutionData): Promise<void> {
        const enablePerformanceTracking = this.getNodeParameter('enablePerformanceTracking', 0) as boolean;
        const sendNotifications = this.getNodeParameter('sendNotifications', 0) as boolean;
        
        if (enablePerformanceTracking) {
          const staticData = this.getWorkflowStaticData('global');
          const executionTime = Date.now() - (staticData.executionStartTime as number);
          
          // Update performance metrics
          staticData.totalExecutionTime = (staticData.totalExecutionTime as number || 0) + executionTime;
          staticData.averageExecutionTime = staticData.totalExecutionTime / staticData.executionCount;
          
          this.logger.info('Workflow execution completed', {
            executionId: this.getExecutionId(),
            executionTime,
            averageExecutionTime: staticData.averageExecutionTime,
            success: data.resultData.runData ? true : false,
          });
        }
        
        if (sendNotifications) {
          await this.sendSuccessNotification(data);
        }
      },
    ],

    onError: [
      async function(this: IHookFunctions, error: Error): Promise<void> {
        const logLevel = this.getNodeParameter('logLevel', 0) as string;
        const sendNotifications = this.getNodeParameter('sendNotifications', 0) as boolean;
        
        // Log error details
        this.logger.error('Workflow execution failed', {
          executionId: this.getExecutionId(),
          error: error.message,
          stack: error.stack,
          mode: this.getMode(),
        });
        
        // Update error statistics
        const staticData = this.getWorkflowStaticData('global');
        staticData.errorCount = (staticData.errorCount as number || 0) + 1;
        staticData.lastError = {
          message: error.message,
          timestamp: new Date().toISOString(),
        };
        
        if (sendNotifications) {
          await this.sendErrorNotification(error);
        }
      },
    ],
  };

  private async sendSuccessNotification(data: IRunExecutionData): Promise<void> {
    try {
      await this.helpers.httpRequest({
        method: 'POST',
        url: 'https://api.example.com/notifications',
        body: {
          type: 'workflow_success',
          workflowId: this.getWorkflow().id,
          executionId: this.getExecutionId(),
          timestamp: new Date().toISOString(),
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      this.logger.warning('Failed to send success notification', { error: error.message });
    }
  }

  private async sendErrorNotification(error: Error): Promise<void> {
    try {
      await this.helpers.httpRequest({
        method: 'POST',
        url: 'https://api.example.com/notifications',
        body: {
          type: 'workflow_error',
          workflowId: this.getWorkflow().id,
          executionId: this.getExecutionId(),
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (notificationError) {
      this.logger.warning('Failed to send error notification', { 
        error: notificationError.message 
      });
    }
  }
}
```

## Common Patterns

### Resource Management Hook

```ts
hooks = {
  beforeExecute: [
    async function(this: IHookFunctions): Promise<void> {
      // Initialize database connections
      const staticData = this.getWorkflowStaticData('global');
      
      if (!staticData.dbConnection) {
        const connectionString = this.getNodeParameter('connectionString', 0) as string;
        staticData.dbConnection = await this.helpers.dbConnect(connectionString);
        
        this.logger.info('Database connection established');
      }
      
      // Initialize cache
      if (!staticData.cache) {
        staticData.cache = new Map();
        this.logger.info('Cache initialized');
      }
    },
  ],

  afterExecute: [
    async function(this: IHookFunctions): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      
      // Clean up temporary resources
      if (staticData.tempFiles) {
        for (const file of staticData.tempFiles as string[]) {
          try {
            await this.helpers.deleteFile(file);
          } catch (error) {
            this.logger.warning(`Failed to delete temp file: ${file}`);
          }
        }
        staticData.tempFiles = [];
      }
      
      // Clear cache if it gets too large
      if (staticData.cache && staticData.cache.size > 1000) {
        staticData.cache.clear();
        this.logger.info('Cache cleared due to size limit');
      }
    },
  ],

  onError: [
    async function(this: IHookFunctions, error: Error): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      
      // Close database connection on critical errors
      if (this.isCriticalError(error) && staticData.dbConnection) {
        try {
          await staticData.dbConnection.close();
          delete staticData.dbConnection;
          this.logger.info('Database connection closed due to critical error');
        } catch (closeError) {
          this.logger.error('Failed to close database connection', { 
            error: closeError.message 
          });
        }
      }
    },
  ],
};

private isCriticalError(error: Error): boolean {
  return (
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('Authentication failed')
  );
}
```

### Performance Monitoring Hook

```ts
hooks = {
  beforeExecute: [
    async function(this: IHookFunctions): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      
      // Initialize performance metrics
      staticData.performanceMetrics = {
        startTime: Date.now(),
        memoryUsage: process.memoryUsage(),
        nodeExecutionTimes: {},
      };
      
      this.logger.debug('Performance monitoring started');
    },
  ],

  afterExecute: [
    async function(this: IHookFunctions, data: IRunExecutionData): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      const metrics = staticData.performanceMetrics as any;
      
      if (metrics) {
        const endTime = Date.now();
        const executionTime = endTime - metrics.startTime;
        const endMemoryUsage = process.memoryUsage();
        
        // Calculate memory delta
        const memoryDelta = {
          rss: endMemoryUsage.rss - metrics.memoryUsage.rss,
          heapUsed: endMemoryUsage.heapUsed - metrics.memoryUsage.heapUsed,
          heapTotal: endMemoryUsage.heapTotal - metrics.memoryUsage.heapTotal,
        };
        
        // Log performance metrics
        this.logger.info('Performance metrics', {
          executionTime,
          memoryDelta,
          nodeCount: Object.keys(data.resultData.runData || {}).length,
        });
        
        // Store historical data
        const history = staticData.performanceHistory as any[] || [];
        history.push({
          timestamp: new Date().toISOString(),
          executionTime,
          memoryDelta,
          success: !data.resultData.error,
        });
        
        // Keep only last 100 executions
        staticData.performanceHistory = history.slice(-100);
      }
    },
  ],
};
```

### Audit Logging Hook

```ts
hooks = {
  beforeExecute: [
    async function(this: IHookFunctions): Promise<void> {
      const auditLog = {
        executionId: this.getExecutionId(),
        workflowId: this.getWorkflow().id,
        workflowName: this.getWorkflow().name,
        startTime: new Date().toISOString(),
        mode: this.getMode(),
        activationMode: this.getActivationMode(),
        user: this.getExecutionData()?.userId || 'system',
      };
      
      // Store audit log
      await this.storeAuditLog('execution_started', auditLog);
    },
  ],

  afterExecute: [
    async function(this: IHookFunctions, data: IRunExecutionData): Promise<void> {
      const auditLog = {
        executionId: this.getExecutionId(),
        endTime: new Date().toISOString(),
        success: !data.resultData.error,
        nodesExecuted: Object.keys(data.resultData.runData || {}).length,
        itemsProcessed: this.calculateItemsProcessed(data),
      };
      
      await this.storeAuditLog('execution_completed', auditLog);
    },
  ],

  onError: [
    async function(this: IHookFunctions, error: Error): Promise<void> {
      const auditLog = {
        executionId: this.getExecutionId(),
        errorTime: new Date().toISOString(),
        errorMessage: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
      };
      
      await this.storeAuditLog('execution_failed', auditLog);
    },
  ],
};

private async storeAuditLog(event: string, data: any): Promise<void> {
  try {
    const staticData = this.getWorkflowStaticData('global');
    const auditLogs = staticData.auditLogs as any[] || [];
    
    auditLogs.push({
      event,
      timestamp: new Date().toISOString(),
      ...data,
    });
    
    // Keep only last 1000 audit logs
    staticData.auditLogs = auditLogs.slice(-1000);
    
    // Also send to external audit system
    await this.helpers.httpRequest({
      method: 'POST',
      url: 'https://audit.example.com/logs',
      body: { event, ...data },
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    this.logger.warning('Failed to store audit log', { error: error.message });
  }
}

private calculateItemsProcessed(data: IRunExecutionData): number {
  let totalItems = 0;
  
  if (data.resultData.runData) {
    for (const nodeData of Object.values(data.resultData.runData)) {
      for (const runData of nodeData) {
        if (runData.data?.main?.[0]) {
          totalItems += runData.data.main[0].length;
        }
      }
    }
  }
  
  return totalItems;
}
```

### Rate Limiting Hook

```ts
hooks = {
  beforeExecute: [
    async function(this: IHookFunctions): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      const maxExecutionsPerHour = this.getNodeParameter('maxExecutionsPerHour', 0) as number;
      
      if (maxExecutionsPerHour > 0) {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        // Clean old execution timestamps
        const executions = (staticData.recentExecutions as number[]) || [];
        const recentExecutions = executions.filter(time => time > oneHourAgo);
        
        // Check rate limit
        if (recentExecutions.length >= maxExecutionsPerHour) {
          throw new NodeOperationError(
            this.getNode(),
            `Rate limit exceeded: ${maxExecutionsPerHour} executions per hour`
          );
        }
        
        // Add current execution
        recentExecutions.push(now);
        staticData.recentExecutions = recentExecutions;
        
        this.logger.debug('Rate limit check passed', {
          currentExecutions: recentExecutions.length,
          maxExecutions: maxExecutionsPerHour,
        });
      }
    },
  ],
};
```

### Circuit Breaker Hook

```ts
hooks = {
  beforeExecute: [
    async function(this: IHookFunctions): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      const circuitBreaker = staticData.circuitBreaker as any || {
        state: 'closed',
        failures: 0,
        lastFailureTime: 0,
        maxFailures: 5,
        timeout: 60000, // 1 minute
      };
      
      // Check circuit breaker state
      if (circuitBreaker.state === 'open') {
        const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
        
        if (timeSinceLastFailure > circuitBreaker.timeout) {
          // Move to half-open state
          circuitBreaker.state = 'half-open';
          this.logger.info('Circuit breaker moved to half-open state');
        } else {
          throw new NodeOperationError(
            this.getNode(),
            'Circuit breaker is open - workflow execution blocked'
          );
        }
      }
      
      staticData.circuitBreaker = circuitBreaker;
    },
  ],

  afterExecute: [
    async function(this: IHookFunctions): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      const circuitBreaker = staticData.circuitBreaker as any;
      
      if (circuitBreaker) {
        // Reset on successful execution
        circuitBreaker.failures = 0;
        circuitBreaker.state = 'closed';
        staticData.circuitBreaker = circuitBreaker;
        
        this.logger.debug('Circuit breaker reset to closed state');
      }
    },
  ],

  onError: [
    async function(this: IHookFunctions, error: Error): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      const circuitBreaker = staticData.circuitBreaker as any;
      
      if (circuitBreaker) {
        circuitBreaker.failures++;
        circuitBreaker.lastFailureTime = Date.now();
        
        if (circuitBreaker.failures >= circuitBreaker.maxFailures) {
          circuitBreaker.state = 'open';
          this.logger.warning('Circuit breaker opened due to repeated failures', {
            failures: circuitBreaker.failures,
            maxFailures: circuitBreaker.maxFailures,
          });
        }
        
        staticData.circuitBreaker = circuitBreaker;
      }
    },
  ],
};
```

## Best Practices

### 1. Keep Hooks Lightweight

```ts
// ✅ Good - lightweight and focused
hooks = {
  beforeExecute: [
    async function(this: IHookFunctions): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      staticData.startTime = Date.now();
    },
  ],
};

// ❌ Bad - heavy operations that slow down execution
hooks = {
  beforeExecute: [
    async function(this: IHookFunctions): Promise<void> {
      // Don't do heavy operations in hooks
      await this.processLargeDataset();
      await this.syncWithExternalSystem();
    },
  ],
};
```

### 2. Handle Hook Errors Gracefully

```ts
hooks = {
  afterExecute: [
    async function(this: IHookFunctions): Promise<void> {
      try {
        await this.sendNotification();
      } catch (error) {
        // Don't let hook errors break the workflow
        this.logger.warning('Hook notification failed', { error: error.message });
      }
    },
  ],
};
```

### 3. Use Static Data Efficiently

```ts
hooks = {
  beforeExecute: [
    async function(this: IHookFunctions): Promise<void> {
      const staticData = this.getWorkflowStaticData('global');
      
      // Initialize only if needed
      if (!staticData.initialized) {
        staticData.cache = new Map();
        staticData.metrics = { executions: 0, errors: 0 };
        staticData.initialized = true;
      }
      
      // Clean up old data periodically
      if (staticData.metrics.executions % 100 === 0) {
        this.cleanupOldData(staticData);
      }
    },
  ],
};
```

## See Also

- **[IExecuteFunctions](./IExecuteFunctions)** - Main execution context
- **[getWorkflowStaticData](../workflow/getWorkflowStaticData)** - Managing persistent state
- **[Error Handling](../../advanced/ErrorHandling)** - Robust error management
- **[Custom Validation](../../advanced/CustomValidation)** - Input validation patterns
