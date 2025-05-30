# Declarative Pattern Summary

| Strengths                  | Limitations                   |
| -------------------------- | ----------------------------- |
| Easy to build and maintain | No logic layer                |
| Great for onboarding       | Limited control               |
| Clean UI integration       | Harder to debug               |
| Fast to prototype          | Not suitable for complex APIs |

The declarative pattern is a powerful tool for simple use cases, and a great way to get started with custom n8n nodes.

## Basic `execute` Returning JSON Array

Sometimes you need a simple `execute` method for testing or returning hardcoded data:

```ts
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const operation = this.getNodeParameter('operation', i) as string;

    if (operation === 'test') {
      // Return some test data
      returnData.push({
        json: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          status: 'active',
        },
      });
    }
  }

  return [returnData];
}
```

This simple execute method checks the operation parameter and returns hardcoded test data. It's useful for prototyping or when you need minimal custom logic alongside declarative routing.
