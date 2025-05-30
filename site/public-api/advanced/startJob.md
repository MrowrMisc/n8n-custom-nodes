---
title: startJob
description: Launch background jobs from a node and await their result
---

# startJob

The `startJob` function allows a node to launch a background job and await its result. This is useful for offloading long-running or asynchronous tasks to a separate execution context while maintaining control and observability.

## When to Use

Use `startJob` when your node needs to:
- Launch a long-running or asynchronous task
- Offload work to a background worker
- Integrate with job queues or task runners
- Perform parallel or distributed processing
- Await a result from an external system or service

## Function Signature

```ts
startJob<T = unknown, E = unknown>(
  jobType: string,
  settings: unknown,
  itemIndex: number
): Promise<Result<T, E>>
```

## Parameters

- **jobType**: A string identifier for the type of job to start
- **settings**: Arbitrary configuration or payload for the job
- **itemIndex**: The index of the item in the input data this job is associated with

## Return Value

Returns a `Promise<Result<T, E>>` where:
- `T` is the success result type
- `E` is the error result type
- The result is a discriminated union with `success: true` or `success: false`

## Basic Usage

```ts
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const results = []

  for (let i = 0; i < items.length; i++) {
    const jobSettings = {
      userId: items[i].json.userId,
      action: 'generateReport'
    }

    const result = await this.startJob('report-generator', jobSettings, i)

    if (result.success) {
      results.push({
        json: {
          ...items[i].json,
          reportUrl: result.data.url,
          jobStatus: 'completed'
        }
      })
    } else {
      results.push({
        json: {
          ...items[i].json,
          jobStatus: 'failed',
          error: result.error
        }
      })
    }
  }

  return [results]
}
```

## Advanced Usage

### Retrying Failed Jobs

```ts
const maxRetries = 3
let attempt = 0
let result

do {
  result = await this.startJob('data-sync', { recordId }, itemIndex)
  attempt++
} while (!result.success && attempt < maxRetries)

if (!result.success) {
  throw new Error(`Job failed after ${maxRetries} attempts: ${result.error}`)
}
```

### Parallel Job Launching

```ts
const jobPromises = items.map((item, index) =>
  this.startJob('image-processing', { imageUrl: item.json.url }, index)
)

const jobResults = await Promise.all(jobPromises)

const results = jobResults.map((result, i) => ({
  json: {
    ...items[i].json,
    status: result.success ? 'done' : 'error',
    output: result.success ? result.data : result.error
  }
}))

return [results]
```

## Best Practices

1. **Use unique jobType strings** to distinguish job handlers
2. **Validate job settings** before launching
3. **Handle both success and error cases** from the result
4. **Avoid blocking jobs** that take too long to return
5. **Use retries or backoff** for transient failures
6. **Log job metadata** for observability

## Related Documentation

- [logAiEvent](./logAiEvent.md) - For logging AI-related events
- [sendMessageToUI](./sendMessageToUI.md) - For communicating with the UI
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
