---
title: Common Interfaces
description: Reference for key interfaces used in n8n node development
---

# Common Interfaces

This page provides a reference for key interfaces used throughout the n8n public API. These interfaces define the structure of data passed between nodes, workflows, credentials, and the execution engine.

## INodeExecutionData

```ts
interface INodeExecutionData {
  json: IDataObject
  binary?: IBinaryKeyData
  error?: NodeApiError | NodeOperationError
  pairedItem?: IPairedItemData | IPairedItemData[] | number
  metadata?: {
    subExecution: RelatedExecution
  }
}
```

Represents a single item of data passed between nodes.

---

## IDataObject

```ts
interface IDataObject {
  [key: string]: string | number | boolean | object | null | undefined | IDataObject | IDataObject[]
}
```

Generic key-value structure used throughout the API.

---

## IBinaryData

```ts
interface IBinaryData {
  data: string
  mimeType: string
  fileType?: string
  fileName?: string
  directory?: string
  fileExtension?: string
  fileSize?: string
  id?: string
}
```

Represents binary file data attached to an item.

---

## INodeProperties

```ts
interface INodeProperties {
  displayName: string
  name: string
  type: NodePropertyTypes
  default: NodeParameterValueType
  description?: string
  required?: boolean
  options?: INodePropertyOptions[]
  displayOptions?: IDisplayOptions
}
```

Defines a parameter for a node.

---

## ICredentialType

```ts
interface ICredentialType {
  name: string
  displayName: string
  properties: INodeProperties[]
  authenticate?: IAuthenticate
  test?: ICredentialTestRequest
}
```

Defines a credential type used by nodes.

---

## INodeTypeDescription

```ts
interface INodeTypeDescription {
  displayName: string
  name: string
  group: string[]
  version: number
  inputs: string[]
  outputs: string[]
  properties: INodeProperties[]
  credentials?: INodeCredentialDescription[]
}
```

Metadata for a node type.

---

## IWorkflowMetadata

```ts
interface IWorkflowMetadata {
  id?: string
  name?: string
  active: boolean
}
```

Basic metadata about a workflow.

---

## INode

```ts
interface INode {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  disabled?: boolean
  notes?: string
  notesInFlow?: boolean
  retryOnFail?: boolean
  maxTries?: number
  waitBetweenTries?: number
  alwaysOutputData?: boolean
  executeOnce?: boolean
  onError?: 'continueErrorOutput' | 'continueRegularOutput' | 'stopWorkflow'
  continueOnFail?: boolean
  parameters: INodeParameters
  credentials?: INodeCredentials
  webhookId?: string
  extendsCredential?: string
  rewireOutputLogTo?: string
}
```

Represents a node instance in a workflow.

---

## INodeType

```ts
interface INodeType {
  description: INodeTypeDescription
  supplyData?(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>
  execute?(this: IExecuteFunctions): Promise<INodeExecutionData[][] | null>
  poll?(this: IPollFunctions): Promise<INodeExecutionData[][] | null>
  trigger?(this: ITriggerFunctions): Promise<ITriggerResponse | undefined>
  webhook?(this: IWebhookFunctions): Promise<IWebhookResponseData>
  methods?: {
    loadOptions?: {
      [key: string]: (this: ILoadOptionsFunctions) => Promise<INodePropertyOptions[]>
    }
    listSearch?: {
      [key: string]: (
        this: ILoadOptionsFunctions,
        filter?: string,
        paginationToken?: string,
      ) => Promise<INodeListSearchResult>
    }
    credentialTest?: {
      [functionName: string]: ICredentialTestFunction
    }
    resourceMapping?: {
      [functionName: string]: (this: ILoadOptionsFunctions) => Promise<ResourceMapperFields>
    }
    localResourceMapping?: {
      [functionName: string]: (this: ILocalLoadOptionsFunctions) => Promise<ResourceMapperFields>
    }
    actionHandler?: {
      [functionName: string]: (
        this: ILoadOptionsFunctions,
        payload: IDataObject | string | undefined,
      ) => Promise<NodeParameterValueType>
    }
  }
  webhookMethods?: {
    [name in WebhookType]?: {
      [method in WebhookSetupMethodNames]: (this: IHookFunctions) => Promise<boolean>
    }
  }
  customOperations?: {
    [resource: string]: {
      [operation: string]: (this: IExecuteFunctions) => Promise<INodeExecutionData[][] | null>
    }
  }
}
```

Defines the structure and behavior of a node implementation.


```ts
interface INodeParameters {
  [key: string]: NodeParameterValueType
}
```

Holds the configured parameter values for a node.

---

## See Also

- [Types Reference](./types.md)
- [Execution Contexts](../execution-contexts/IExecuteFunctions.md)
- [Helpers](../helpers/index.md)
