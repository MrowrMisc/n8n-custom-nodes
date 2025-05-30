# HttpBasicAuth Credential - Implementation Patterns

## Key Learning Points

### 1. Basic Credential Structure
- Implements `ICredentialType` interface
- Simple class with required properties and methods

### 2. Essential Properties
```typescript
name = 'httpBasicAuth';           // Unique identifier
displayName = 'Basic Auth';       // User-facing name
documentationUrl = 'httpRequest'; // Links to docs
genericAuth = true;               // Marks as generic auth type
icon: Icon = 'node:n8n-nodes-base.httpRequest'; // UI icon
```

### 3. Properties Definition
- Uses `INodeProperties[]` array to define form fields
- Each property has:
  - `displayName`: Label shown to user
  - `name`: Internal field name
  - `type`: Input type ('string', 'boolean', etc.)
  - `default`: Default value
  - `typeOptions`: Special options (e.g., `password: true` for hidden input)

### 4. Implementation Patterns
- **Minimal Structure**: Just class properties, no methods needed
- **Type Safety**: Strong typing with interfaces from n8n-workflow
- **Generic Auth**: `genericAuth = true` makes it available across nodes
- **Icon Reference**: Uses node reference format for consistent UI

### 5. Field Types Observed
- `string` with `typeOptions.password: true` for sensitive data
- Simple default values

### 6. Reusable Patterns
- Keep credential classes minimal and focused
- Use descriptive `displayName` for UX
- Mark generic auth credentials with `genericAuth = true`
- Reference existing icons when possible
