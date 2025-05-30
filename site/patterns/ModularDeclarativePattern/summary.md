# Modular Declarative Pattern Summary

| Strengths                        | Limitations                                 |
| -------------------------------- | ------------------------------------------- |
| Scales well with many operations | More files and structure to manage          |
| Encourages code reuse            | Slightly more complex to onboard            |
| Declarative + dynamic behavior   | Requires understanding of advanced features |
| Clean separation of concerns     | Overkill for small nodes                    |

This pattern is ideal for large, complex APIs that benefit from modularity and declarative structure.

## `execute` Using Helper Functions

Keep your `execute` method clean by importing utility functions:

**MyNode.node.ts:**
```ts
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { description } from './description';
import { methods } from './methods';
import { handleUserOperations } from './utils/userOperations';
import { handleProjectOperations } from './utils/projectOperations';
import { validateInputs } from './utils/validation';

export class MyNode implements INodeType {
  description: INodeTypeDescription = description;
  methods = methods;

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;
      
      // Validate inputs using helper function
      validateInputs(resource, operation);
      
      let result;
      
      if (resource === 'user') {
        result = await handleUserOperations.call(this, operation, i);
      } else if (resource === 'project') {
        result = await handleProjectOperations.call(this, operation, i);
      }
      
      if (result) {
        returnData.push({ json: result });
      }
    }

    return [returnData];
  }
}
```

**utils/userOperations.ts:**
```ts
import { IExecuteFunctions } from 'n8n-workflow';
import { makeApiRequest } from './apiHelpers';

export async function handleUserOperations(
  this: IExecuteFunctions,
  operation: string,
  itemIndex: number,
): Promise<any> {
  switch (operation) {
    case 'create':
      const userData = {
        name: this.getNodeParameter('name', itemIndex) as string,
        email: this.getNodeParameter('email', itemIndex) as string,
      };
      return await makeApiRequest.call(this, 'POST', '/users', userData);
      
    case 'get':
      const userId = this.getNodeParameter('userId', itemIndex) as string;
      return await makeApiRequest.call(this, 'GET', `/users/${userId}`);
      
    default:
      throw new Error(`Unknown user operation: ${operation}`);
  }
}
```

This modular approach keeps your main execute method readable while organizing complex logic into focused utility functions.
