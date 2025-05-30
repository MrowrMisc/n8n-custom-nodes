# Collections & Additional Fields

Collections and additional fields allow you to group related parameters and support dynamic key-value input.

## Collections

```ts
{
  displayName: "Options",
  name: "options",
  type: "collection",
  default: {},
  options: [
    {
      displayName: "Limit",
      name: "limit",
      type: "number",
      default: 10,
    },
  ],
}
```

## Additional Fields

```ts
{
  displayName: "Headers",
  name: "headers",
  type: "fixedCollection",
  typeOptions: { multipleValues: true },
  default: {},
  options: [
    {
      name: "header",
      displayName: "Header",
      values: [
        { name: "name", type: "string" },
        { name: "value", type: "string" },
      ],
    },
  ],
}
```

## Use Cases
- Optional advanced settings
- Dynamic headers, query params, or metadata
- Grouping related inputs

[TODO: inline code]
