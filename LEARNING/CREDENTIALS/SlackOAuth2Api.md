# SlackOAuth2Api Credential - Implementation Patterns

## Key Learning Points

### 1. Credential Inheritance
- Uses `extends = ['oAuth2Api']` to inherit from base OAuth2 credential
- Overrides specific fields while keeping the base structure

### 2. Hidden Field Pattern
```typescript
{
  displayName: 'Grant Type',
  name: 'grantType',
  type: 'hidden',
  default: 'authorizationCode'
}
```
- `type: 'hidden'` hides fields from user but sets defaults
- Useful for service-specific OAuth configurations

### 3. Predefined Scopes Management
```typescript
const userScopes = [
  'channels:read',
  'channels:write',
  'chat:write',
  // ... more scopes
];

// Used in field:
default: `user_scope=${userScopes.join(' ')}`
```

### 4. Service-Specific URLs
- Hardcodes service-specific OAuth URLs:
  - `authUrl`: 'https://slack.com/oauth/v2/authorize'
  - `accessTokenUrl`: 'https://slack.com/api/oauth.v2.access'

### 5. User Guidance with Notice Type
```typescript
{
  displayName: 'If you get an Invalid Scopes error...',
  name: 'notice',
  type: 'notice',
  default: ''
}
```
- `type: 'notice'` displays informational text with HTML links
- Provides troubleshooting guidance

### 6. Implementation Patterns
- **Inheritance**: Extend base credentials and override specific fields
- **Hidden Defaults**: Use hidden fields to set service-specific values
- **Scope Management**: Define scopes as constants for reusability
- **User Guidance**: Use notice fields for help and troubleshooting
- **Service Integration**: Hardcode known service endpoints

### 7. Reusable Patterns
- Extend generic OAuth2 for service-specific implementations
- Use constants for scope arrays that might be reused
- Hide complex OAuth details from users while maintaining flexibility
- Provide contextual help with notice fields
- Reference external documentation in notices

### 8. Advanced Techniques
- String interpolation in defaults: `user_scope=${userScopes.join(' ')}`
- HTML links in notice fields for external documentation
- Separation of concerns: base OAuth2 logic vs service-specific config
