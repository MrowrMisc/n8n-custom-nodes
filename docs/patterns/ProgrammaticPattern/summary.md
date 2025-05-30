# Programmatic Pattern Summary

| Strengths                       | Limitations                     |
| ------------------------------- | ------------------------------- |
| Full control over logic         | More code to maintain           |
| Supports complex workflows      | Requires deeper n8n knowledge   |
| Great for advanced integrations | Not as beginner-friendly        |
| Modular and scalable            | Less declarative UI integration |

The programmatic pattern is the most powerful and flexible way to build custom n8n nodes. It’s the right choice when you need to go beyond what declarative routing can offer.

## Error Handling with `NodeApiError`

Proper error handling is crucial in programmatic nodes. Use `NodeApiError` for consistent error formatting:

```ts
import { NodeApiError } from 'n8n-workflow';

async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const response = await this.helpers.request({
        method: 'GET',
        url: 'https://api.example.com/data',
        json: true,
      });
      
      returnData.push({ json: response });
    } catch (error) {
      // Check if it's an HTTP error
      if (error.response?.status) {
        throw new NodeApiError(this.getNode(), error, {
          message: `API request failed with status ${error.response.status}`,
          description: error.response.data?.message || 'Unknown API error',
          httpCode: error.response.status,
        });
      }
      
      // Handle other errors
      throw new NodeApiError(this.getNode(), error, {
        message: 'Request failed',
        description: error.message,
      });
    }
  }

  return [returnData];
}
```

This provides users with clear, actionable error messages in the n8n UI.
