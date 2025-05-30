# When to Use the Declarative Pattern

The declarative pattern is best suited for:

- Simple REST APIs with predictable endpoints
- CRUD operations (Create, Read, Update, Delete)
- Nodes that don’t require custom logic or transformation
- APIs that use static query parameters or headers
- Prototyping or teaching new node authors

Avoid using this pattern when:
- You need to transform data dynamically
- You need to handle pagination, retries, or conditional logic
- You need to work with binary data
- You need to interact with complex authentication flows

## `loadOptionsMethod` with Static Options

Declarative nodes can provide dropdown options using `loadOptionsMethod`. Here's a simple example that returns static options:

```ts
// In the node description
{
  displayName: 'Priority',
  name: 'priority',
  type: 'options',
  typeOptions: {
    loadOptionsMethod: 'getPriorities',
  },
  default: 'medium',
  description: 'Priority level for the task',
}

// In the methods section
methods = {
  loadOptions: {
    async getPriorities(): Promise<INodePropertyOptions[]> {
      return [
        {
          name: 'Low',
          value: 'low',
        },
        {
          name: 'Medium',
          value: 'medium',
        },
        {
          name: 'High',
          value: 'high',
        },
        {
          name: 'Critical',
          value: 'critical',
        },
      ];
    },
  },
};
```

This creates a dropdown with predefined priority levels. The method can also make API calls to fetch dynamic options.
