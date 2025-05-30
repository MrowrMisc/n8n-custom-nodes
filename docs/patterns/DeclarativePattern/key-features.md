# Key Features of the Declarative Pattern

| Feature              | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `routing.request`    | Defines HTTP method, URL, headers, and query string     |
| `type: 'options'`    | Creates dropdowns for selecting operations or resources |
| `type: 'collection'` | Groups optional fields under “Additional Fields”        |
| `displayOptions`     | Controls conditional visibility of fields               |
| `authenticate`       | Injects credentials (e.g. API key via query string)     |
| No `execute()`       | All behavior is declarative—no imperative logic         |

These features make declarative nodes easy to build, maintain, and understand—especially for simple use cases.

## Using `default` and `required`

Declarative nodes make it easy to enforce required fields and provide sensible defaults:

```ts
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  required: true,
  default: 'get',
  options: [
    {
      name: 'Get User',
      value: 'get',
    },
    {
      name: 'List Users',
      value: 'list',
    },
  ],
},
{
  displayName: 'Limit',
  name: 'limit',
  type: 'number',
  default: 10,
  description: 'Maximum number of results to return',
  displayOptions: {
    show: {
      operation: ['list'],
    },
  },
}
```

The `required: true` field ensures users must select an operation, while `default: 'get'` provides a sensible starting point. The limit field has a default of 10 and only appears for list operations.
