# Key Features of the Modular Declarative Pattern

| Feature             | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `loadOptionsMethod` | Dynamically load dropdown options from external files          |
| `routing`           | Declarative HTTP request configuration per operation           |
| `hooks`             | Add pre/post-processing logic without `execute()`              |
| `modular structure` | Split operations/resources into separate files                 |
| `shared utils`      | Reuse logic across operations (e.g. request builders, helpers) |

This pattern is great for large, complex APIs that still benefit from declarative structure.

## `methods.loadOptions` in a Separate File

Move load options logic into a dedicated `methods.ts` file for better organization:

**MyNode.node.ts:**
```ts
import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { description } from './description';
import { methods } from './methods';

export class MyNode implements INodeType {
  description: INodeTypeDescription = description;
  methods = methods;

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Implementation here
    return [[]];
  }
}
```

**methods.ts:**
```ts
import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

export const methods = {
  loadOptions: {
    async getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
      const credentials = await this.getCredentials('myApiCredentials');
      
      const response = await this.helpers.request({
        method: 'GET',
        url: 'https://api.example.com/projects',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        json: true,
      });
      
      return response.projects.map((project: any) => ({
        name: project.name,
        value: project.id,
      }));
    },
    
    async getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
      const credentials = await this.getCredentials('myApiCredentials');
      
      const response = await this.helpers.request({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        json: true,
      });
      
      return response.users.map((user: any) => ({
        name: `${user.firstName} ${user.lastName}`,
        value: user.id,
      }));
    },
  },
};
```

This keeps your main node file clean while organizing all dynamic option loading in one place.
