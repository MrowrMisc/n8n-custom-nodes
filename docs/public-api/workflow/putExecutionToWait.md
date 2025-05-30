---
title: putExecutionToWait
description: Pause workflow execution and resume later with external triggers
---

# putExecutionToWait

The `putExecutionToWait` function allows you to pause the current workflow execution and resume it later when specific conditions are met or external events occur. This is essential for implementing long-running processes, waiting for external approvals, or creating event-driven workflows.

## When to Use

Use `putExecutionToWait` when your node needs to:
- Wait for external approvals or manual interventions
- Implement long-running processes that span hours, days, or weeks
- Create event-driven workflows that respond to external triggers
- Pause execution until specific conditions are met
- Implement timeout-based workflows
- Create workflows that wait for webhook callbacks
- Handle asynchronous operations with unknown completion times

## Function Signature

```typescript
putExecutionToWait(waitTill: Date): Promise<void>
```

## Parameters

- **waitTill**: The date/time when the execution should automatically resume (can be far in the future for manual resume)

## Return Value

Returns a Promise that resolves when the execution is successfully put into wait state.

## Basic Usage

### Simple Wait with Timeout

```typescript
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const waitMinutes = this.getNodeParameter('waitMinutes', 0, 60) as number
  
  // Calculate wait time
  const waitUntil = new Date()
  waitUntil.setMinutes(waitUntil.getMinutes() + waitMinutes)
  
  // Store data for when execution resumes
  const staticData = this.getWorkflowStaticData('global')
  staticData.waitingData = {
    originalItems: items,
    waitStarted: new Date().toISOString(),
    waitUntil: waitUntil.toISOString(),
    reason: 'timeout_wait'
  }
  
  // Put execution to wait
  await this.putExecutionToWait(waitUntil)
  
  // This code runs when execution resumes
  const resumedData = staticData.waitingData
  delete staticData.waitingData
  
  const results = []
  
  for (const item of resumedData.originalItems) {
    results.push({
      json: {
        ...item.json,
        waitInfo: {
          waitStarted: resumedData.waitStarted,
          waitUntil: resumedData.waitUntil,
          resumedAt: new Date().toISOString(),
          waitDuration: Date.now() - new Date(resumedData.waitStarted).getTime()
        }
      }
    })
  }
  
  return [results]
}
```

### Wait for External Approval

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const approvalTimeoutHours = this.getNodeParameter('approvalTimeoutHours', 0, 24) as number
  
  // Set timeout for approval (24 hours default)
  const timeoutDate = new Date()
  timeoutDate.setHours(timeoutDate.getHours() + approvalTimeoutHours)
  
  // Store approval request data
  const staticData = this.getWorkflowStaticData('global')
  const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  staticData.pendingApprovals = staticData.pendingApprovals || {}
  staticData.pendingApprovals[approvalId] = {
    items,
    requestedAt: new Date().toISOString(),
    timeoutAt: timeoutDate.toISOString(),
    status: 'pending',
    approver: null,
    approvedAt: null
  }
  
  // Send approval notification (this would typically trigger a webhook or email)
  await this.helpers.httpRequest({
    method: 'POST',
    url: 'https://your-approval-system.com/api/approvals',
    body: {
      approvalId,
      items: items.map(item => item.json),
      timeoutAt: timeoutDate.toISOString(),
      resumeWebhook: `https://your-n8n-instance.com/webhook/approval/${approvalId}`
    }
  })
  
  // Put execution to wait
  await this.putExecutionToWait(timeoutDate)
  
  // This code runs when execution resumes (either approved or timed out)
  const approvalData = staticData.pendingApprovals[approvalId]
  delete staticData.pendingApprovals[approvalId]
  
  const results = []
  
  if (approvalData.status === 'approved') {
    // Process approved items
    for (const item of approvalData.items) {
      results.push({
        json: {
          ...item.json,
          approvalInfo: {
            approvalId,
            status: 'approved',
            approver: approvalData.approver,
            approvedAt: approvalData.approvedAt,
            requestedAt: approvalData.requestedAt
          }
        }
      })
    }
  } else {
    // Handle timeout or rejection
    for (const item of approvalData.items) {
      results.push({
        json: {
          ...item.json,
          approvalInfo: {
            approvalId,
            status: approvalData.status || 'timeout',
            requestedAt: approvalData.requestedAt,
            timeoutAt: approvalData.timeoutAt,
            error: 'Approval not received within timeout period'
          }
        }
      })
    }
  }
  
  return [results]
}
```

## Advanced Usage

### Multi-Stage Approval Process

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize or get current approval stage
  if (!staticData.approvalProcess) {
    staticData.approvalProcess = {
      stage: 1,
      maxStages: 3,
      approvals: [],
      items,
      startedAt: new Date().toISOString()
    }
  }
  
  const process = staticData.approvalProcess
  const currentStage = process.stage
  
  // Define approval stages
  const approvalStages = [
    { name: 'Manager Approval', timeoutHours: 24, required: true },
    { name: 'Finance Approval', timeoutHours: 48, required: true },
    { name: 'Executive Approval', timeoutHours: 72, required: false }
  ]
  
  if (currentStage <= approvalStages.length) {
    const stage = approvalStages[currentStage - 1]
    const timeoutDate = new Date()
    timeoutDate.setHours(timeoutDate.getHours() + stage.timeoutHours)
    
    // Request approval for current stage
    const approvalId = `stage_${currentStage}_${Date.now()}`
    
    await this.helpers.httpRequest({
      method: 'POST',
      url: 'https://approval-system.com/api/stage-approval',
      body: {
        approvalId,
        stage: currentStage,
        stageName: stage.name,
        items: process.items.map(item => item.json),
        timeoutAt: timeoutDate.toISOString(),
        previousApprovals: process.approvals
      }
    })
    
    // Wait for this stage
    await this.putExecutionToWait(timeoutDate)
    
    // Check if approval was received (this would be set by webhook)
    const stageApproval = staticData.currentStageApproval
    delete staticData.currentStageApproval
    
    if (stageApproval?.approved) {
      // Add approval to process
      process.approvals.push({
        stage: currentStage,
        stageName: stage.name,
        approver: stageApproval.approver,
        approvedAt: stageApproval.approvedAt,
        comments: stageApproval.comments
      })
      
      // Move to next stage
      process.stage++
      
      // If more stages, continue the process
      if (process.stage <= approvalStages.length) {
        return this.execute() // Recursive call for next stage
      }
    } else {
      // Stage was rejected or timed out
      process.status = 'rejected'
      process.rejectedAt = new Date().toISOString()
      process.rejectionReason = stageApproval?.reason || 'Timeout'
    }
  }
  
  // All stages complete or process rejected
  const results = []
  const finalStatus = process.status || 'approved'
  
  for (const item of process.items) {
    results.push({
      json: {
        ...item.json,
        approvalProcess: {
          status: finalStatus,
          stages: process.approvals,
          startedAt: process.startedAt,
          completedAt: new Date().toISOString(),
          totalStages: process.approvals.length
        }
      }
    })
  }
  
  // Clean up
  delete staticData.approvalProcess
  
  return [results]
}
```

### Event-Driven Wait with Multiple Triggers

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize wait state
  if (!staticData.eventWait) {
    const waitId = `wait_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const maxWaitHours = this.getNodeParameter('maxWaitHours', 0, 168) as number // 1 week default
    
    const timeoutDate = new Date()
    timeoutDate.setHours(timeoutDate.getHours() + maxWaitHours)
    
    staticData.eventWait = {
      waitId,
      items,
      startedAt: new Date().toISOString(),
      timeoutAt: timeoutDate.toISOString(),
      expectedEvents: [
        'payment_received',
        'document_signed',
        'approval_granted'
      ],
      receivedEvents: [],
      status: 'waiting'
    }
    
    // Register for events (webhook endpoints)
    await this.helpers.httpRequest({
      method: 'POST',
      url: 'https://event-system.com/api/register-wait',
      body: {
        waitId,
        events: staticData.eventWait.expectedEvents,
        webhookUrl: `https://your-n8n-instance.com/webhook/event/${waitId}`,
        timeoutAt: timeoutDate.toISOString()
      }
    })
    
    // Put execution to wait
    await this.putExecutionToWait(timeoutDate)
  }
  
  // Execution resumed - check what triggered it
  const waitData = staticData.eventWait
  const triggerEvent = staticData.triggerEvent // Set by webhook
  delete staticData.triggerEvent
  
  if (triggerEvent) {
    // Event received
    waitData.receivedEvents.push({
      event: triggerEvent.type,
      data: triggerEvent.data,
      receivedAt: new Date().toISOString()
    })
    
    // Check if all required events received
    const allEventsReceived = waitData.expectedEvents.every(expectedEvent =>
      waitData.receivedEvents.some(received => received.event === expectedEvent)
    )
    
    if (allEventsReceived) {
      waitData.status = 'completed'
    } else {
      // Still waiting for more events, continue waiting
      const remainingTime = new Date(waitData.timeoutAt).getTime() - Date.now()
      if (remainingTime > 0) {
        const newTimeoutDate = new Date(waitData.timeoutAt)
        await this.putExecutionToWait(newTimeoutDate)
        return // Will resume when next event arrives or timeout
      } else {
        waitData.status = 'timeout'
      }
    }
  } else {
    // Timeout occurred
    waitData.status = 'timeout'
  }
  
  // Process final results
  const results = []
  
  for (const item of waitData.items) {
    results.push({
      json: {
        ...item.json,
        eventWaitResult: {
          waitId: waitData.waitId,
          status: waitData.status,
          startedAt: waitData.startedAt,
          completedAt: new Date().toISOString(),
          expectedEvents: waitData.expectedEvents,
          receivedEvents: waitData.receivedEvents,
          allEventsReceived: waitData.status === 'completed'
        }
      }
    })
  }
  
  // Cleanup
  delete staticData.eventWait
  
  return [results]
}
```

### Conditional Wait with Dynamic Conditions

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Check if we're resuming from a wait
  const isResuming = staticData.conditionalWait !== undefined
  
  if (!isResuming) {
    // Initial execution - set up conditional wait
    const condition = this.getNodeParameter('waitCondition', 0) as string
    const checkIntervalMinutes = this.getNodeParameter('checkIntervalMinutes', 0, 15) as number
    const maxWaitHours = this.getNodeParameter('maxWaitHours', 0, 24) as number
    
    staticData.conditionalWait = {
      items,
      condition,
      checkIntervalMinutes,
      startedAt: new Date().toISOString(),
      maxWaitUntil: new Date(Date.now() + maxWaitHours * 60 * 60 * 1000).toISOString(),
      checkCount: 0,
      lastChecked: null
    }
  }
  
  const waitData = staticData.conditionalWait
  waitData.checkCount++
  waitData.lastChecked = new Date().toISOString()
  
  // Check the condition
  const conditionMet = await this.checkCondition(waitData.condition, items)
  
  if (conditionMet) {
    // Condition met, proceed with execution
    const results = []
    
    for (const item of waitData.items) {
      results.push({
        json: {
          ...item.json,
          conditionalWaitResult: {
            conditionMet: true,
            condition: waitData.condition,
            startedAt: waitData.startedAt,
            completedAt: new Date().toISOString(),
            checkCount: waitData.checkCount,
            waitDuration: Date.now() - new Date(waitData.startedAt).getTime()
          }
        }
      })
    }
    
    delete staticData.conditionalWait
    return [results]
  }
  
  // Check if we've exceeded max wait time
  const now = new Date()
  const maxWaitTime = new Date(waitData.maxWaitUntil)
  
  if (now >= maxWaitTime) {
    // Timeout reached
    const results = []
    
    for (const item of waitData.items) {
      results.push({
        json: {
          ...item.json,
          conditionalWaitResult: {
            conditionMet: false,
            condition: waitData.condition,
            startedAt: waitData.startedAt,
            timedOutAt: new Date().toISOString(),
            checkCount: waitData.checkCount,
            error: 'Condition not met within timeout period'
          }
        }
      })
    }
    
    delete staticData.conditionalWait
    return [results]
  }
  
  // Continue waiting - schedule next check
  const nextCheckTime = new Date()
  nextCheckTime.setMinutes(nextCheckTime.getMinutes() + waitData.checkIntervalMinutes)
  
  await this.putExecutionToWait(nextCheckTime)
  
  // This return won't be reached as execution is paused
  return []
}

// Helper method to check conditions
private async checkCondition(condition: string, items: any[]): Promise<boolean> {
  switch (condition) {
    case 'api_status_ready':
      try {
        const response = await this.helpers.httpRequest({
          method: 'GET',
          url: 'https://api.example.com/status'
        })
        return response.status === 'ready'
      } catch {
        return false
      }
    
    case 'file_exists':
      try {
        const filePath = items[0]?.json?.filePath
        if (!filePath) return false
        
        const response = await this.helpers.httpRequest({
          method: 'HEAD',
          url: filePath
        })
        return response.statusCode === 200
      } catch {
        return false
      }
    
    case 'database_record_updated':
      try {
        const recordId = items[0]?.json?.recordId
        const response = await this.helpers.httpRequest({
          method: 'GET',
          url: `https://api.example.com/records/${recordId}`
        })
        return response.lastModified > items[0]?.json?.lastKnownModified
      } catch {
        return false
      }
    
    default:
      return false
  }
}
```

## Wait State Management

### Resuming Executions Programmatically

```typescript
// This would typically be in a webhook or trigger node
export async function resumeExecution(executionId: string, data?: any) {
  const staticData = this.getWorkflowStaticData('global')
  
  // Store resume data
  if (data) {
    staticData.resumeData = data
  }
  
  // Resume the execution (this would be done through n8n's API)
  await this.helpers.httpRequest({
    method: 'POST',
    url: `https://your-n8n-instance.com/api/v1/executions/${executionId}/resume`,
    headers: {
      'Authorization': 'Bearer YOUR_API_TOKEN'
    },
    body: {
      data
    }
  })
}
```

### Wait State Monitoring

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  // Initialize monitoring
  if (!staticData.waitMonitoring) {
    staticData.waitMonitoring = {
      activeWaits: [],
      completedWaits: [],
      statistics: {
        totalWaits: 0,
        averageWaitTime: 0,
        timeoutRate: 0
      }
    }
  }
  
  const monitoring = staticData.waitMonitoring
  const waitId = `wait_${Date.now()}`
  
  // Record wait start
  const waitRecord = {
    waitId,
    startedAt: new Date().toISOString(),
    items: items.length,
    reason: this.getNodeParameter('waitReason', 0, 'general') as string,
    status: 'active'
  }
  
  monitoring.activeWaits.push(waitRecord)
  monitoring.statistics.totalWaits++
  
  // Set up wait
  const waitMinutes = this.getNodeParameter('waitMinutes', 0, 30) as number
  const waitUntil = new Date()
  waitUntil.setMinutes(waitUntil.getMinutes() + waitMinutes)
  
  await this.putExecutionToWait(waitUntil)
  
  // Execution resumed - update monitoring
  const waitIndex = monitoring.activeWaits.findIndex(w => w.waitId === waitId)
  if (waitIndex >= 0) {
    const completedWait = monitoring.activeWaits[waitIndex]
    completedWait.completedAt = new Date().toISOString()
    completedWait.duration = Date.now() - new Date(completedWait.startedAt).getTime()
    completedWait.status = 'completed'
    
    // Move to completed
    monitoring.activeWaits.splice(waitIndex, 1)
    monitoring.completedWaits.push(completedWait)
    
    // Update statistics
    const completedWaits = monitoring.completedWaits
    const totalDuration = completedWaits.reduce((sum, wait) => sum + (wait.duration || 0), 0)
    monitoring.statistics.averageWaitTime = totalDuration / completedWaits.length
  }
  
  return [items]
}
```

## Best Practices

1. **Always store necessary data** in static data before waiting
2. **Set reasonable timeouts** to prevent indefinite waits
3. **Handle resume scenarios** gracefully with proper state checks
4. **Implement cleanup logic** for expired or cancelled waits
5. **Use unique identifiers** for tracking multiple concurrent waits
6. **Monitor wait states** and implement alerting for stuck executions
7. **Test resume scenarios** thoroughly in development
8. **Document wait conditions** clearly for maintenance

## Common Patterns

### Polling with Backoff

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const staticData = this.getWorkflowStaticData('global')
  
  if (!staticData.pollingState) {
    staticData.pollingState = {
      attempt: 0,
      maxAttempts: 10,
      baseDelayMinutes: 1,
      backoffMultiplier: 2,
      startedAt: new Date().toISOString()
    }
  }
  
  const state = staticData.pollingState
  state.attempt++
  
  // Check condition
  const success = await this.checkExternalCondition()
  
  if (success || state.attempt >= state.maxAttempts) {
    // Success or max attempts reached
    delete staticData.pollingState
    return [items]
  }
  
  // Calculate next delay with exponential backoff
  const delayMinutes = state.baseDelayMinutes * Math.pow(state.backoffMultiplier, state.attempt - 1)
  const nextCheck = new Date()
  nextCheck.setMinutes(nextCheck.getMinutes() + delayMinutes)
  
  await this.putExecutionToWait(nextCheck)
  return []
}
```

## Related Documentation

- [getWorkflow](./getWorkflow.md) - For accessing workflow information
- [getWorkflowStaticData](./getWorkflowStaticData.md) - For persistent data storage
- [executeWorkflow](./executeWorkflow.md) - For sub-workflow execution
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
- [ITriggerFunctions](../execution-contexts/ITriggerFunctions.md) - For trigger-based resumes
- [IWebhookFunctions](../execution-contexts/IWebhookFunctions.md) - For webhook-based resumes
