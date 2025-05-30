# HttpRequest Node - Credential Integration Patterns

## Key Learning Points

### 1. Authentication Strategy Selection
```typescript
let authentication;
try {
  authentication = this.getNodeParameter('authentication', 0) as
    | 'predefinedCredentialType'
    | 'genericCredentialType'
    | 'none';
} catch {}

// Three main authentication strategies:
// 1. 'none' - No authentication
// 2. 'genericCredentialType' - Built-in credential types (Basic, Bearer, OAuth, etc.)
// 3. 'predefinedCredentialType' - Service-specific credentials (Google, Slack, etc.)
```
- Three-tier authentication architecture
- Graceful fallback with try/catch for parameter loading
- Clear separation between generic and service-specific credentials

### 2. Generic Credential Type Loading
```typescript
if (authentication === 'genericCredentialType') {
  const genericCredentialType = this.getNodeParameter('genericAuthType', 0) as string;
  
  if (genericCredentialType === 'httpBasicAuth') {
    httpBasicAuth = await this.getCredentials('httpBasicAuth', itemIndex);
  } else if (genericCredentialType === 'httpBearerAuth') {
    httpBearerAuth = await this.getCredentials('httpBearerAuth', itemIndex);
  } else if (genericCredentialType === 'httpDigestAuth') {
    httpDigestAuth = await this.getCredentials('httpDigestAuth', itemIndex);
  } else if (genericCredentialType === 'httpHeaderAuth') {
    httpHeaderAuth = await this.getCredentials('httpHeaderAuth', itemIndex);
  } else if (genericCredentialType === 'httpQueryAuth') {
    httpQueryAuth = await this.getCredentials('httpQueryAuth', itemIndex);
  } else if (genericCredentialType === 'httpCustomAuth') {
    httpCustomAuth = await this.getCredentials('httpCustomAuth', itemIndex);
  } else if (genericCredentialType === 'oAuth1Api') {
    oAuth1Api = await this.getCredentials('oAuth1Api', itemIndex);
  } else if (genericCredentialType === 'oAuth2Api') {
    oAuth2Api = await this.getCredentials('oAuth2Api', itemIndex);
  }
}
```
- Dynamic credential loading based on user selection
- Per-item credential loading for different authentication per item
- Comprehensive coverage of authentication methods

### 3. Predefined Credential Type Loading
```typescript
else if (authentication === 'predefinedCredentialType') {
  nodeCredentialType = this.getNodeParameter('nodeCredentialType', itemIndex) as string;
}

// Later in execution:
const additionalOAuth2Options = getOAuth2AdditionalParameters(nodeCredentialType);

const requestWithAuthentication = this.helpers.requestWithAuthentication.call(
  this,
  nodeCredentialType,
  requestOptions,
  additionalOAuth2Options && { oauth2: additionalOAuth2Options },
  itemIndex,
);
```
- Service-specific credential handling
- Additional OAuth2 parameters for specific services
- Delegated authentication to n8n's credential system

### 4. Basic Authentication Injection
```typescript
if (httpBasicAuth !== undefined) {
  requestOptions.auth = {
    user: httpBasicAuth.user as string,
    pass: httpBasicAuth.password as string,
  };
  authDataKeys.auth = ['pass']; // Track sensitive fields for sanitization
}
```
- Standard HTTP Basic Auth implementation
- Credential injection into request options
- Sensitive field tracking for UI sanitization

### 5. Bearer Token Authentication
```typescript
if (httpBearerAuth !== undefined) {
  requestOptions.headers = requestOptions.headers ?? {};
  requestOptions.headers.Authorization = `Bearer ${String(httpBearerAuth.token)}`;
  authDataKeys.headers = ['Authorization']; // Track for sanitization
}
```
- Authorization header injection
- Proper Bearer token formatting
- Header initialization safety

### 6. Header-Based Authentication
```typescript
if (httpHeaderAuth !== undefined) {
  requestOptions.headers![httpHeaderAuth.name as string] = httpHeaderAuth.value;
  authDataKeys.headers = [httpHeaderAuth.name as string];
}
```
- Custom header injection
- Dynamic header name support
- Flexible authentication header patterns

### 7. Query Parameter Authentication
```typescript
if (httpQueryAuth !== undefined) {
  if (!requestOptions.qs) {
    requestOptions.qs = {};
  }
  requestOptions.qs[httpQueryAuth.name as string] = httpQueryAuth.value;
  authDataKeys.qs = [httpQueryAuth.name as string];
}
```
- Query string authentication
- Query object initialization
- API key in URL parameter pattern

### 8. Digest Authentication
```typescript
if (httpDigestAuth !== undefined) {
  requestOptions.auth = {
    user: httpDigestAuth.user as string,
    pass: httpDigestAuth.password as string,
    sendImmediately: false, // Key difference from Basic Auth
  };
  authDataKeys.auth = ['pass'];
}
```
- HTTP Digest Auth implementation
- `sendImmediately: false` for proper digest flow
- Similar structure to Basic Auth with key differences

### 9. Custom Authentication
```typescript
if (httpCustomAuth !== undefined) {
  const customAuth = jsonParse<IRequestOptionsSimplified>(
    (httpCustomAuth.json as string) || '{}',
    { errorMessage: 'Invalid Custom Auth JSON' },
  );
  
  if (customAuth.headers) {
    requestOptions.headers = { ...requestOptions.headers, ...customAuth.headers };
    authDataKeys.headers = Object.keys(customAuth.headers);
  }
  if (customAuth.body) {
    requestOptions.body = { ...(requestOptions.body as IDataObject), ...customAuth.body };
    authDataKeys.body = Object.keys(customAuth.body);
  }
  if (customAuth.qs) {
    requestOptions.qs = { ...requestOptions.qs, ...customAuth.qs };
    authDataKeys.qs = Object.keys(customAuth.qs);
  }
}
```
- Flexible JSON-based authentication
- Multiple injection points (headers, body, query)
- Safe JSON parsing with error handling
- Comprehensive auth data tracking

### 10. OAuth1 Integration
```typescript
if (oAuth1Api) {
  const requestOAuth1 = this.helpers.requestOAuth1.call(
    this,
    'oAuth1Api',
    requestOptions,
  );
  requestOAuth1.catch(() => {});
  requestPromises.push(requestOAuth1);
}
```
- Delegated OAuth1 handling to n8n helpers
- Promise-based request execution
- Error handling with empty catch

### 11. OAuth2 Integration
```typescript
else if (oAuth2Api) {
  const requestOAuth2 = this.helpers.requestOAuth2.call(
    this,
    'oAuth2Api',
    requestOptions,
    {
      tokenType: 'Bearer', // Default token type
    },
  );
  requestOAuth2.catch(() => {});
  requestPromises.push(requestOAuth2);
}
```
- OAuth2 helper delegation
- Configurable token type
- Automatic token refresh handling

### 12. SSL Certificate Authentication
```typescript
const provideSslCertificates = this.getNodeParameter(
  'provideSslCertificates',
  itemIndex,
  false,
);

if (provideSslCertificates) {
  sslCertificates = await this.getCredentials('httpSslAuth', itemIndex);
}

// Later in execution:
setAgentOptions(requestOptions, sslCertificates);
if (requestOptions.agentOptions) {
  authDataKeys.agentOptions = Object.keys(requestOptions.agentOptions);
}
```
- Client certificate authentication
- Agent options configuration
- Certificate-based mutual TLS

### 13. Credential Sanitization for UI
```typescript
const authDataKeys: IAuthDataSanitizeKeys = {};

// Track sensitive fields during credential injection
authDataKeys.auth = ['pass'];
authDataKeys.headers = ['Authorization'];
authDataKeys.qs = [httpQueryAuth.name as string];

// Later, sanitize for UI display
try {
  const { options, authKeys, credentialType } = requests[itemIndex];
  let secrets: string[] = [];
  
  if (credentialType) {
    const properties = this.getCredentialsProperties(credentialType);
    const credentials = await this.getCredentials(credentialType, itemIndex);
    secrets = getSecrets(properties, credentials);
  }
  
  const sanitizedRequestOptions = sanitizeUiMessage(options, authKeys, secrets);
  this.sendMessageToUI(sanitizedRequestOptions);
} catch (e) {}
```
- Comprehensive secret tracking
- Dynamic secret extraction from credential properties
- Safe UI message sanitization
- Graceful error handling for UI updates

### 14. Request Execution Patterns
```typescript
// Generic credentials (Basic, Bearer, etc.)
if (authentication === 'genericCredentialType' || authentication === 'none') {
  if (oAuth1Api) {
    const requestOAuth1 = this.helpers.requestOAuth1.call(this, 'oAuth1Api', requestOptions);
    requestPromises.push(requestOAuth1);
  } else if (oAuth2Api) {
    const requestOAuth2 = this.helpers.requestOAuth2.call(this, 'oAuth2Api', requestOptions, { tokenType: 'Bearer' });
    requestPromises.push(requestOAuth2);
  } else {
    // Basic, Bearer, Header, Query, Digest, Custom, None
    const request = this.helpers.request(requestOptions);
    requestPromises.push(request);
  }
}

// Service-specific credentials
else if (authentication === 'predefinedCredentialType' && nodeCredentialType) {
  const additionalOAuth2Options = getOAuth2AdditionalParameters(nodeCredentialType);
  
  const requestWithAuthentication = this.helpers.requestWithAuthentication.call(
    this,
    nodeCredentialType,
    requestOptions,
    additionalOAuth2Options && { oauth2: additionalOAuth2Options },
    itemIndex,
  );
  requestPromises.push(requestWithAuthentication);
}
```
- Different execution paths for different auth types
- OAuth requires special helper methods
- Service-specific credentials use `requestWithAuthentication`
- Generic credentials use standard `request` helper

### 15. Implementation Patterns
- **Three-Tier Architecture**: None, Generic, Service-Specific
- **Dynamic Loading**: Credentials loaded based on user selection
- **Multiple Injection Points**: Headers, auth object, query params, body
- **Comprehensive Tracking**: All sensitive fields tracked for sanitization
- **Delegated Complexity**: OAuth and service-specific auth handled by helpers
- **Security First**: Sanitization and secret management throughout

### 16. Reusable Patterns for Node Authors
- Use three-tier authentication strategy (none/generic/specific)
- Load credentials per-item for maximum flexibility
- Track all sensitive fields in `authDataKeys` object
- Use appropriate helper methods for OAuth vs simple auth
- Sanitize all debug output with `sanitizeUiMessage`
- Handle credential loading errors gracefully
- Support SSL certificates for mutual TLS
- Provide custom auth options for flexibility
- Use proper token types for OAuth2
- Initialize request objects safely before injection

### 16. Alternative Pattern: Manual Credential Injection
Some nodes like Telegram use a simpler pattern with predefined credentials:

```typescript
// Telegram node credential declaration
credentials: [
  {
    name: 'telegramApi',
    required: true,
  },
],

// Manual credential usage in execute method
const credentials = await this.getCredentials('telegramApi');
const uri = `${credentials.baseUrl}/file/bot${credentials.accessToken}/${filePath}`;
```

- Single predefined credential type
- No dynamic authentication strategy switching
- Node manually constructs authenticated URLs/requests
- Simpler for APIs with straightforward token-based auth
- No need for complex injection logic
