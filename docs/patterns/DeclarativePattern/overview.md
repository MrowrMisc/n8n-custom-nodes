# Declarative Pattern Overview

The declarative pattern in n8n allows you to define node behavior entirely through metadata—no `execute()` method required. It’s ideal for simple REST APIs and CRUD-style operations.

This pattern is best suited for:
- Simple HTTP requests
- Static routing
- Minimal transformation logic

## Complete Example

Here’s a minimal but complete declarative node using `request` and `routing`:

```ts
import { INodeType, INodeTypeDescription } from 'n8n-workflow'

export class DeclarativeExample implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Declarative Example',
    name: 'declarativeExample',
    group: ['transform'],
    version: 1,
    description: 'A simple declarative node',
    defaults: {
      name: 'Declarative Example',
    },
    inputs: ['main'],
    outputs: ['main'],
    requestDefaults: {
      baseURL: 'https://jsonplaceholder.typicode.com',
    },
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          {
            name: 'User',
            value: 'user',
          },
        ],
        default: 'user',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Get',
            value: 'get',
          },
        ],
        default: 'get',
      },
      {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['get'],
          },
        },
      },
    ],
    routing: {
      request: {
        method: 'GET',
        url: '=/users/{{$parameter.userId}}',
      },
    },
  }
}
```

This node performs a GET request to `/users/{userId}` using declarative routing.


One of the most common features in declarative nodes is conditional field visibility using `displayOptions`:

```ts
{
  displayName: 'User ID',
  name: 'userId',
  type: 'string',
  displayOptions: {
    show: {
      operation: ['get', 'update', 'delete'],
    },
  },
  default: '',
  description: 'The ID of the user to operate on',
}
```

This field will only appear when the `operation` parameter is set to 'get', 'update', or 'delete'. You can also use `hide` to do the opposite:

```ts
displayOptions: {
  hide: {
    operation: ['list'],
  },
}
```
