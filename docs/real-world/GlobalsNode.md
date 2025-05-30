# Globals Node

The Globals node is a clever hack that injects user-defined constants into the workflow using a credential as a configuration store.

## Credential

```ts
export class GlobalConstantsCredentials implements ICredentialType {
  name = "globalConstantsApi"
  displayName = "Global Constants"
  properties = [
    {
      displayName: "Global Constants",
      name: "globalConstants",
      type: "string",
      default: "",
      placeholder: "name1=value1\\nname2=value2",
      typeOptions: { rows: 10 },
    },
  ]
}
```

## Node

```ts
const credentials = await this.getCredentials("globalConstantsApi")
const constants = splitConstants(credentials.globalConstants)
```

- Optionally wraps constants in a single key
- Injects constants into each item or creates a new one

## Use Cases
- Inject environment-specific values
- Centralize constants for reuse
- Avoid hardcoding values in workflows

## Teaching Value
- Shows how credentials can be used for non-auth config
- Demonstrates flexible output shaping
- Great example of a transform node with no external API

[TODO: inline code]
