# Modular Declarative Pattern Overview

The modular declarative pattern combines the simplicity of declarative routing with the flexibility of modular code organization. It’s ideal for large nodes with many operations or resources.

This pattern is best suited for:
- APIs with many endpoints or resources
- Nodes that benefit from code reuse and separation
- Declarative nodes that need dynamic routing or metadata

It uses `loadOptionsMethod`, `routing`, and `hooks` to dynamically build behavior from modular files.

## Complete Example

Here’s a minimal but complete modular declarative node:

**ModularDeclarativeExample.node.ts**
```ts
import { INodeType, INodeTypeDescription } from 'n8n-workflow'
import { description } from './description'

export class ModularDeclarativeExample implements INodeType {
  description: INodeTypeDescription = description
}
```

**description.ts**
```ts
import { INodeTypeDescription } from 'n8n-workflow'

export const description: INodeTypeDescription = {
  displayName: 'Modular Declarative Example',
  name: 'modularDeclarativeExample',
  group: ['transform'],
  version: 1,
  description: 'A modular declarative node',
  defaults: {
    name: 'Modular Declarative Example',
  },
  inputs: ['main'],
  outputs: ['main'],
  requestDefaults: {
    baseURL: 'https://jsonplaceholder.typicode.com',
  },
  properties: [
    {
      displayName: 'User ID',
      name: 'userId',
      type: 'string',
      default: '',
    },
  ],
  routing: {
    request: {
      method: 'GET',
      url: '=/users/{{$parameter.userId}}',
    },
  },
}
```

This node separates the description into its own file for better maintainability.


Separate your node description into a dedicated file for better organization:

**MyNode.node.ts:**
```ts
import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { description } from './description';

export class MyNode implements INodeType {
  description: INodeTypeDescription = description;

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Implementation here
    return [[]];
  }
}
```

**description.ts:**
```ts
import { INodeTypeDescription } from 'n8n-workflow';

export const description: INodeTypeDescription = {
  displayName: 'My API',
  name: 'myApi',
  icon: 'file:myapi.svg',
  group: ['transform'],
  version: 1,
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Interact with My API',
  defaults: {
    name: 'My API',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'myApiCredentials',
      required: true,
    },
  ],
  properties: [
    {
      displayName: 'Resource',
      name: 'resource',
      type: 'options',
      noDataExpression: true,
      options: [
        {
          name: 'User',
          value: 'user',
        },
        {
          name: 'Project',
          value: 'project',
        },
      ],
      default: 'user',
    },
    // More properties...
  ],
};
```

This separation makes large node descriptions much more manageable and easier to maintain.
