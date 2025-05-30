# Custom Node Analysis: Global Constants

This document explores the design and implementation of the `n8n-nodes-globals` package, which introduces a clever pattern for injecting user-defined constants into workflows using a custom credential and node.

---

## 🔐 Credential: `GlobalConstantsCredentials`

```ts
export class GlobalConstantsCredentials implements ICredentialType {
  name = 'globalConstantsApi';
  displayName = 'Global Constants';

  properties: INodeProperties[] = [
    {
      displayName: 'Global Constants',
      name: 'globalConstants',
      type: 'string',
      default: '',
      placeholder: 'name1=value1\\nname2=value2',
      hint: 'Use "name=value" format. Separate multiple constants with a new line.',
      typeOptions: { rows: 10 },
    },
  ];
}
```

### Highlights

- **Non-auth Credential**: Used purely for configuration, not authentication.
- **Multi-line String Input**: Encodes multiple constants in a single string field.
- **User Guidance**: Includes placeholder and hint for formatting.

---

## 🧩 Node: `GlobalConstants`

```ts
const credentials = await this.getCredentials('globalConstantsApi');
const globalConstants = splitConstants(credentials.globalConstants);
```

### Behavior

- Reads the constants from the credential.
- Parses them into a key-value object using a helper.
- Injects them into each input item, or creates a new item if none exist.

### Options

- `putAllInOneKey` (boolean): If true, wraps constants under a single key.
- `constantsKeyName` (string): Name of the key to wrap constants under.

### Output Modes

| Mode                     | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `putAllInOneKey = true`  | `{ constants: { name1: value1, name2: value2 } }` |
| `putAllInOneKey = false` | `{ name1: value1, name2: value2 }`                |

---

## 🧠 Design Insights

- ✅ **Creative Use of Credentials**: Repurposes credential storage for global config.
- ✅ **Flexible Output**: Supports both merged and wrapped constant injection.
- ✅ **Input-Agnostic**: Works with or without input items.
- ❌ **No Validation**: Assumes user input is well-formed.
- ❌ **No Credential Test**: But not needed for this use case.

---

## 🧪 Teaching Value

This project is a great example of:
- Using credentials for non-auth configuration
- Transforming input data with injected constants
- Supporting both "fan-out" and "merge" patterns
- Keeping node logic simple and focused

---

## 📦 Summary

| Component  | Pattern                                  |
| ---------- | ---------------------------------------- |
| Credential | Non-auth config store                    |
| Node       | Transform with injected constants        |
| Output     | Configurable merge or wrap               |
| Cleverness | High — repurposes credentials creatively |
