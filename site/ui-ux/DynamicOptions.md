# Dynamic Options

Dynamic options allow you to populate dropdowns based on external data or other parameters.

## Syntax

```ts
{
  displayName: "Project",
  name: "projectId",
  type: "options",
  typeOptions: {
    loadOptionsMethod: "getProjects",
  },
  default: "",
}
```

## Method

```ts
methods: {
  loadOptions: {
    async getProjects() {
      const response = await this.helpers.request("https://api.example.com/projects")
      return response.map(project => ({
        name: project.name,
        value: project.id,
      }))
    },
  },
}
```

## Use Cases
- Load user-specific data (e.g. workspaces, boards)
- Fetch options from an API
- Create dependent dropdowns

[TODO: inline code]
