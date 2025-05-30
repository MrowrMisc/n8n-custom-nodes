# HttpBearerAuth Credential - Implementation Patterns

## Key Learning Points

### 1. Generic Authentication Interface
- Uses `IAuthenticateGeneric` instead of custom `authenticate()` method
- Simpler approach for standard authentication patterns

### 2. Declarative Authentication
```typescript
authenticate: IAuthenticateGeneric = {
  type: 'generic',
  properties: {
    headers: {
      Authorization: 'Bearer ={{$credentials.token}}',
    },
  },
};
```
- Declarative approach vs imperative custom method
- Uses n8n expression syntax: `={{$credentials.token}}`

### 3. ESLint Rule Exceptions
```typescript
// eslint-disable-next-line n8n-nodes-base/cred-class-name-unsuffixed
// eslint-disable-next-line n8n-nodes-base/cred-class-field-name-unsuffixed
```
- Shows there are specific linting rules for credential naming
- Sometimes rules need to be disabled for specific cases

### 4. User Education with Notice
```typescript
{
  displayName: 'This credential uses the "Authorization" header. To use a custom header, use a "Custom Auth" credential instead',
  name: 'useCustomAuth',
  type: 'notice',
  default: ''
}
```
- Educates users about limitations and alternatives
- Prevents common misuse patterns

### 5. Simple Token-Based Auth
- Single field credential with password protection
- Most minimal viable authentication credential

### 6. Implementation Patterns
- **Generic Auth**: Use `IAuthenticateGeneric` for standard patterns
- **Expression Syntax**: Use `={{$credentials.fieldName}}` to reference fields
- **User Education**: Use notices to explain behavior and alternatives
- **Rule Exceptions**: Document when linting rules need exceptions

### 7. Comparison with Custom Auth
- **HttpBearerAuth**: Declarative, simple, limited to Authorization header
- **GoogleApi**: Custom method, complex logic, full control over request

### 8. Reusable Patterns
- Use `IAuthenticateGeneric` for simple header/query/body auth
- Reference credential fields with n8n expression syntax
- Add educational notices to prevent misuse
- Keep simple credentials minimal and focused
- Use password type for sensitive tokens

### 9. When to Use Each Approach
- **Generic Auth**: Standard patterns (Bearer, Basic, API Key in header/query)
- **Custom Method**: Complex flows (OAuth, JWT generation, multi-step auth)
