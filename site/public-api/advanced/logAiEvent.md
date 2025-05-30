---
title: logAiEvent
description: Log AI-related events during workflow execution for observability and debugging
---

# logAiEvent

The `logAiEvent` function allows nodes to log AI-related events during workflow execution. These logs are useful for observability, debugging, and analytics when working with AI agents, tools, or workflows.

## When to Use

Use `logAiEvent` when your node:
- Interacts with AI models or agents
- Embeds or retrieves documents for vector search
- Tracks AI tool usage or output
- Needs to emit structured telemetry for AI operations
- Implements custom AI logic or orchestration

## Function Signature

```ts
logAiEvent(eventName: AiEvent, msg?: string): void
```

## Parameters

- **eventName**: A string enum representing the type of AI event (see below)
- **msg** *(optional)*: A human-readable message or context string

## Event Types

The `eventName` must be one of the following predefined AI event types:

| Event Name                          | Description                             |
| ----------------------------------- | --------------------------------------- |
| `ai-messages-retrieved-from-memory` | Retrieved messages from memory context  |
| `ai-message-added-to-memory`        | Added a message to memory               |
| `ai-output-parsed`                  | Parsed output from an LLM               |
| `ai-documents-retrieved`            | Retrieved documents for context         |
| `ai-document-embedded`              | Embedded a document into a vector store |
| `ai-query-embedded`                 | Embedded a query for vector search      |
| `ai-document-processed`             | Processed a document for AI use         |
| `ai-text-split`                     | Split text into chunks                  |
| `ai-tool-called`                    | Called an AI tool                       |
| `ai-vector-store-searched`          | Queried a vector store                  |
| `ai-llm-generated-output`           | LLM generated a response                |
| `ai-llm-errored`                    | LLM call failed                         |
| `ai-vector-store-populated`         | Populated a vector store                |
| `ai-vector-store-updated`           | Updated a vector store                  |

## Basic Usage

```ts
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()

  this.logAiEvent('ai-llm-generated-output', 'LLM returned a response for user query')

  return [items]
}
```

## Advanced Usage

### Logging Multiple Events

```ts
this.logAiEvent('ai-query-embedded', 'Embedding user query for semantic search')
this.logAiEvent('ai-vector-store-searched', 'Searching vector store for top 5 matches')
this.logAiEvent('ai-llm-generated-output', 'LLM generated summary from retrieved context')
```

### Logging Errors

```ts
try {
  const result = await callLLM()
  this.logAiEvent('ai-llm-generated-output', 'LLM call succeeded')
} catch (error) {
  this.logAiEvent('ai-llm-errored', `LLM call failed: ${error.message}`)
  throw error
}
```

## Best Practices

1. **Use structured event names** from the `AiEvent` enum
2. **Include context** in the message to aid debugging
3. **Log before and after** key AI operations
4. **Avoid logging sensitive data** in messages
5. **Use consistent phrasing** for easier filtering

## Related Documentation

- [startJob](./startJob.md) - For launching background jobs
- [sendMessageToUI](./sendMessageToUI.md) - For communicating with the UI
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
