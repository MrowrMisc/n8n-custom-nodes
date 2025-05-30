# GoogleApi Credential - Implementation Patterns

## Key Learning Points

### 1. Advanced Credential with Custom Authentication
- Implements both properties AND custom `authenticate()` method
- Shows how to handle complex authentication flows (JWT-based)

### 2. External Dependencies
```typescript
import axios from 'axios';
import jwt from 'jsonwebtoken';
import moment from 'moment-timezone';
```
- Uses external libraries for HTTP requests, JWT signing, and date handling
- Shows credentials can have complex dependencies

### 3. Large Static Data Arrays
```typescript
const regions = [
  { name: 'africa-south1', displayName: 'Africa', location: 'Johannesburg' },
  // ... 40+ more regions
] as const;
```
- Uses `as const` for type safety with large static arrays
- Maps data to options format for dropdowns

### 4. Dynamic Options Generation
```typescript
options: regions.map((r) => ({
  name: `${r.displayName} (${r.location}) - ${r.name}`,
  value: r.name,
}))
```
- Transforms static data into UI-friendly options
- Template literals for complex display names

### 5. Custom Authentication Method
```typescript
async authenticate(
  credentials: ICredentialDataDecryptedObject,
  requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions>
```
- Implements custom auth logic beyond simple token/header auth
- Returns modified request options with authentication

### 6. JWT Token Generation
```typescript
const signature = jwt.sign(
  {
    iss: credentials.email,
    sub: credentials.delegatedEmail || credentials.email,
    scope: scopes,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  },
  privateKey,
  { algorithm: 'RS256', header: { kid: privateKey, typ: 'JWT', alg: 'RS256' } }
);
```

### 7. Conditional Authentication
```typescript
if (!credentials.httpNode) return requestOptions;
```
- Only applies authentication when specific flag is set
- Allows credential to work in different contexts

### 8. String Processing
```typescript
const privateKey = (credentials.privateKey as string).replace(/\\n/g, '\n').trim();
const regex = /[,\s\n]+/;
const scopes = credentialsScopes.split(regex).filter((scope) => scope).join(' ');
```
- Handles newline escaping and scope parsing
- Robust string processing for user input

### 9. Implementation Patterns
- **Custom Auth**: Implement `authenticate()` for complex flows
- **External APIs**: Make HTTP requests within credentials
- **Data Transformation**: Process and validate user input
- **Conditional Logic**: Apply auth only when needed
- **Token Management**: Handle token generation and expiration

### 10. Reusable Patterns
- Use static data arrays with `as const` for type safety
- Transform data arrays into UI options with `.map()`
- Implement custom authentication for service-specific flows
- Handle string processing and validation robustly
- Use external libraries when needed for complex operations
- Return modified request options from `authenticate()`
