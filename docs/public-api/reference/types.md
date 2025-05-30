---
title: Common Types
description: Reference for common type aliases used in n8n node development
---

# Common Types

This page provides a reference for common type aliases used throughout the n8n public API. These types are used in node parameters, execution contexts, helpers, and workflow metadata.

## NodeParameterValueType

```ts
type NodeParameterValueType =
  string |
  number |
  boolean |
  undefined |
  null |
  INodeParameters |
  INodeParameterResourceLocator |
  ResourceMapperValue |
  FilterValue |
  AssignmentCollectionValue |
  NodeParameterValue[] |
  INodeParameters[] |
  INodeParameterResourceLocator[] |
  ResourceMapperValue[]
```

Represents the full range of values a node parameter can take.

---

## NodeConnectionType

```ts
type NodeConnectionType =
  | 'main'
  | 'ai_agent'
  | 'ai_chain'
  | 'ai_document'
  | 'ai_embedding'
  | 'ai_languageModel'
  | 'ai_memory'
  | 'ai_outputParser'
  | 'ai_retriever'
  | 'ai_textSplitter'
  | 'ai_tool'
  | 'ai_vectorStore'
```

Used to define the type of connection between nodes.

---

## WorkflowExecuteMode

```ts
type WorkflowExecuteMode =
  | 'cli'
  | 'error'
  | 'integrated'
  | 'internal'
  | 'manual'
  | 'retry'
  | 'trigger'
  | 'webhook'
  | 'evaluation'
```

Indicates how a workflow is being executed.

---

## FieldType

```ts
type FieldType =
  | 'boolean'
  | 'number'
  | 'string'
  | 'string-alphanumeric'
  | 'dateTime'
  | 'time'
  | 'array'
  | 'object'
  | 'options'
  | 'url'
  | 'jwt'
  | 'form-fields'
```

Used for validation and resource mapping.

---

## AiEvent

```ts
type AiEvent =
  | 'ai-messages-retrieved-from-memory'
  | 'ai-message-added-to-memory'
  | 'ai-output-parsed'
  | 'ai-documents-retrieved'
  | 'ai-document-embedded'
  | 'ai-query-embedded'
  | 'ai-document-processed'
  | 'ai-text-split'
  | 'ai-tool-called'
  | 'ai-vector-store-searched'
  | 'ai-llm-generated-output'
  | 'ai-llm-errored'
  | 'ai-vector-store-populated'
  | 'ai-vector-store-updated'
```

Used with `logAiEvent()` to track AI-related operations.

---

## WebhookResponseMode

```ts
type WebhookResponseMode = 'onReceived' | 'lastNode' | 'responseNode' | 'formPage'
```

Controls how webhook responses are handled.

---

## LogLevel

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
```

Used for logging levels in the `Logger` interface.

---

## Result

```ts
type Result<T, E> = { success: true; data: T } | { success: false; error: E }
```

Used by `startJob()` and other async helpers to return success or error outcomes.

---

## GenericValue

```ts
type GenericValue = string | object | number | boolean | undefined | null
```

A flexible value type used in many places like `IDataObject`.

---

## See Also

- [Interfaces Reference](./interfaces.md)
- [Execution Contexts](../execution-contexts/IExecuteFunctions.md)
- [Helpers](../helpers/index.md)
