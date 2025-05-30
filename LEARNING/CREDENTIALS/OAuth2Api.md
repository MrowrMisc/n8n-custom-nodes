# OAuth2Api Credential - Implementation Patterns

## Key Learning Points

### 1. Advanced Credential Structure
- More complex than basic auth with multiple field types
- Implements conditional field display logic

### 2. Field Types and Options
```typescript
// Options dropdown
{
  displayName: 'Grant Type',
  name: 'grantType',
  type: 'options',
  options: [
    { name: 'Authorization Code', value: 'authorizationCode' },
    { name: 'Client Credentials', value: 'clientCredentials' },
    { name: 'PKCE', value: 'pkce' }
  ],
  default: 'authorizationCode'
}
```

### 3. Conditional Field Display
- Uses `displayOptions.show` to conditionally show fields:
```typescript
displayOptions: {
  show: {
    grantType: ['authorizationCode', 'pkce']
  }
}
```

### 4. Field Validation
- `required: true` for mandatory fields
- Combines with conditional display for smart forms

### 5. Special Properties
- `typeOptions.password: true` for sensitive data
- `doNotInherit: true` prevents field inheritance
- `placeholder` for user guidance
- `description` for detailed help text

### 6. Security Considerations
- Important comment about scope security:
  ```typescript
  // WARNING: if you are extending from this credentials and allow user to set their own scopes
  // you HAVE TO add it to GENERIC_OAUTH2_CREDENTIALS_WITH_EDITABLE_SCOPE
  ```

### 7. Implementation Patterns
- **Conditional Logic**: Show/hide fields based on other field values
- **Validation**: Use `required` for mandatory fields
- **User Experience**: Placeholders and descriptions for guidance
- **Security**: Special handling for sensitive fields and scopes
- **Flexibility**: Support multiple OAuth2 grant types in one credential

### 8. Reusable Patterns
- Use `options` type for dropdowns with predefined choices
- Implement conditional display with `displayOptions.show`
- Add helpful descriptions and placeholders
- Mark sensitive fields appropriately
- Consider inheritance with `doNotInherit`
