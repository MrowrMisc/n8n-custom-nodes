# Key Features of the Programmatic Pattern

| Feature            | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `execute()`        | Full control over logic, inputs, and outputs                |
| `getNodeParameter` | Dynamically access user input                               |
| `this.helpers`     | Access built-in utilities (e.g. HTTP requests, OAuth, etc.) |
| `continueOnFail()` | Gracefully handle errors per item                           |
| Modular Dispatch   | Use a `router` to delegate to resource/operation handlers   |

These features make the programmatic pattern ideal for complex, dynamic, or high-control use cases.

## Using `this.helpers.request`

The `this.helpers.request` method is the standard way to make HTTP requests in n8n nodes:

```ts
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const userId = this.getNodeParameter('userId', i) as string;
    
    try {
      const response = await this.helpers.request({
        method: 'GET',
        url: `https://api.example.com/users/${userId}`,
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN',
          'Content-Type': 'application/json',
        },
        json: true,
      });
      
      returnData.push({
        json: response,
      });
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          error,
        });
      } else {
        throw error;
      }
    }
  }

  return [returnData];
}
```

This example shows how to make authenticated API requests with proper error handling using `continueOnFail()`.
