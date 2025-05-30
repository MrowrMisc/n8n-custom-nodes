---
title: sendMessageToUI
description: Send custom messages from a node to the n8n Editor UI
---

# sendMessageToUI

The `sendMessageToUI` function allows a node to send custom messages to the n8n Editor UI during execution. This is useful for providing real-time feedback, progress updates, or custom UI interactions while a workflow is running.

## When to Use

Use `sendMessageToUI` when your node needs to:
- Display progress or status updates in the UI
- Send custom messages to the frontend
- Trigger UI-side behavior during execution
- Provide real-time feedback for long-running operations
- Communicate structured data to the UI for visualization

## Function Signature

```ts
sendMessageToUI(message: any): void
```

## Parameters

- **message**: Any serializable object to send to the UI. It should include a `type` field to identify the message kind.

## Return Value

This function does not return a value. It sends a message to the UI asynchronously.

## Basic Usage

```ts
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()

  this.sendMessageToUI({
    type: 'progress',
    message: 'Starting processing...',
    timestamp: new Date().toISOString()
  })

  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 1000))

  this.sendMessageToUI({
    type: 'progress',
    message: 'Processing complete!',
    timestamp: new Date().toISOString()
  })

  return [items]
}
```

## Advanced Usage

### Sending Structured Data

```ts
this.sendMessageToUI({
  type: 'chart-data',
  chartType: 'bar',
  data: {
    labels: ['A', 'B', 'C'],
    values: [10, 20, 30]
  }
})
```

### Sending Error Notifications

```ts
this.sendMessageToUI({
  type: 'error',
  message: 'Something went wrong during processing',
  details: {
    node: this.getNode().name,
    time: new Date().toISOString()
  }
})
```

## Best Practices

1. **Use a `type` field** to distinguish message types
2. **Avoid sending large payloads** to the UI
3. **Throttle frequent updates** to prevent UI overload
4. **Use consistent message formats** for easier handling
5. **Document expected message types** for frontend developers

## UI Integration

To handle messages in the UI, listen for `nodeExecutionMessage` events in the n8n Editor. Custom plugins or extensions can use this to display progress bars, charts, or logs.

## Related Documentation

- [startJob](./startJob.md) - For launching background jobs
- [logAiEvent](./logAiEvent.md) - For logging AI-related events
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
