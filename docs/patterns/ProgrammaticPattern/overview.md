# Programmatic Pattern Overview

The programmatic pattern in n8n gives you full control over node behavior by implementing an `execute()` method. It’s the go-to approach for complex APIs, dynamic logic, and advanced workflows.

This pattern is best suited for:
- APIs with dynamic or conditional behavior
- Nodes that need to transform or validate data
- Workflows that require pagination, retries, or binary handling

## Complete Example

Here’s a minimal but complete programmatic node:

```ts
import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow'

export class ProgrammaticExample implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Programmatic Example',
    name: 'programmaticExample',
    group: ['transform'],
    version: 1,
    description: 'A simple programmatic node',
    defaults: {
      name: 'Programmatic Example',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Greet',
            value: 'greet',
          },
        ],
        default: 'greet',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: 'World',
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const returnData: INodeExecutionData[] = []

    for (let i = 0; i < items.length; i++) {
      const name = this.getNodeParameter('name', i) as string
      returnData.push({ json: { message: `Hello, ${name}!` } })
    }

    return [returnData]
  }
}
```

This node uses the `execute()` method to return a greeting message.


The heart of programmatic nodes is the `execute()` method with branching logic:

```ts
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const operation = this.getNodeParameter('operation', i) as string;
    const resource = this.getNodeParameter('resource', i) as string;

    if (resource === 'user') {
      if (operation === 'create') {
        const name = this.getNodeParameter('name', i) as string;
        const email = this.getNodeParameter('email', i) as string;
        
        // Create user logic
        const newUser = {
          id: Math.floor(Math.random() * 1000),
          name,
          email,
          created_at: new Date().toISOString(),
        };
        
        returnData.push({ json: newUser });
      } else if (operation === 'get') {
        const userId = this.getNodeParameter('userId', i) as string;
        
        // Get user logic
        const user = {
          id: userId,
          name: 'John Doe',
          email: 'john@example.com',
        };
        
        returnData.push({ json: user });
      }
    }
  }

  return [returnData];
}
```

This pattern allows you to handle different operations and resources with custom logic for each case.
