# Credential Implementation Patterns

## Key Learning Points

### 1. Basic Credential Structure
```typescript
export class HttpBasicAuth implements ICredentialType {
  name = 'httpBasicAuth';
  displayName = 'Basic Auth';
  documentationUrl = 'httpRequest';
  genericAuth = true;
  icon: Icon = 'node:n8n-nodes-base.httpRequest';
  
  properties: INodeProperties[] = [
    {
      displayName: 'User',
      name: 'user',
      type: 'string',
      default: '',
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: { password: true },
      default: '',
    },
  ];
}
```
- Simple credential structure with minimal properties
- `genericAuth = true` marks it as reusable across nodes
- Password field with `typeOptions: { password: true }` for masking
- Icon reference to associated node

### 2. OAuth2 Generic Credential
```typescript
export class OAuth2Api implements ICredentialType {
  name = 'oAuth2Api';
  displayName = 'OAuth2 API';
  documentationUrl = 'httpRequest';
  genericAuth = true;
  
  properties: INodeProperties[] = [
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'options',
      options: [
        { name: 'Authorization Code', value: 'authorizationCode' },
        { name: 'Client Credentials', value: 'clientCredentials' },
        { name: 'PKCE', value: 'pkce' },
      ],
      default: 'authorizationCode',
    },
    {
      displayName: 'Authorization URL',
      name: 'authUrl',
      type: 'string',
      displayOptions: {
        show: { grantType: ['authorizationCode', 'pkce'] },
      },
      default: '',
      required: true,
    },
    // ... more OAuth2 fields
  ];
}
```
- Multiple OAuth2 grant types supported
- Conditional field display based on grant type
- Generic OAuth2 implementation for any service
- Required field validation

### 3. Service-Specific Credential with Authentication
```typescript
export class GoogleApi implements ICredentialType {
  name = 'googleApi';
  displayName = 'Google Service Account API';
  documentationUrl = 'google/service-account';
  icon: Icon = 'file:icons/Google.svg';
  
  properties: INodeProperties[] = [
    {
      displayName: 'Region',
      name: 'region',
      type: 'options',
      options: regions.map((r) => ({
        name: `${r.displayName} (${r.location}) - ${r.name}`,
        value: r.name,
      })),
      default: 'us-central1',
    },
    {
      displayName: 'Service Account Email',
      name: 'email',
      type: 'string',
      placeholder: 'name@email.com',
      required: true,
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: { password: true },
      required: true,
    },
    {
      displayName: 'Set up for use in HTTP Request node',
      name: 'httpNode',
      type: 'boolean',
      default: false,
    },
  ];

  async authenticate(
    credentials: ICredentialDataDecryptedObject,
    requestOptions: IHttpRequestOptions,
  ): Promise<IHttpRequestOptions> {
    if (!credentials.httpNode) return requestOptions;

    // JWT token generation and OAuth2 flow
    const privateKey = (credentials.privateKey as string).replace(/\\n/g, '\n').trim();
    const signature = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    
    // Exchange JWT for access token
    const result = await axios({
      method: 'POST',
      url: 'https://oauth2.googleapis.com/token',
      data: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signature,
      }).toString(),
    });

    return {
      ...requestOptions,
      headers: {
        ...requestOptions.headers,
        Authorization: `Bearer ${result.data.access_token}`,
      },
    };
  }
}
```
- Service-specific credential with custom authentication logic
- Dynamic region selection with mapped options
- Custom `authenticate` method for complex auth flows
- JWT signing and token exchange implementation

### 4. Conditional Field Display Patterns
```typescript
// OAuth2 - Show auth URL only for certain grant types
{
  displayName: 'Authorization URL',
  name: 'authUrl',
  displayOptions: {
    show: { grantType: ['authorizationCode', 'pkce'] },
  },
}

// Google - Show scopes only when HTTP node setup is enabled
{
  displayName: 'Scope(s)',
  name: 'scopes',
  displayOptions: {
    show: { httpNode: [true] },
  },
}

// Google - Show delegated email only when impersonation is enabled
{
  displayName: 'Email',
  name: 'delegatedEmail',
  displayOptions: {
    show: { inpersonate: [true] },
  },
}
```
- Progressive disclosure based on user selections
- Conditional field visibility for cleaner UX
- Context-specific field requirements

### 5. Field Type Patterns
```typescript
// Password fields with masking
{
  displayName: 'Password',
  name: 'password',
  type: 'string',
  typeOptions: { password: true },
}

// Select dropdown with options
{
  displayName: 'Grant Type',
  name: 'grantType',
  type: 'options',
  options: [
    { name: 'Authorization Code', value: 'authorizationCode' },
    { name: 'Client Credentials', value: 'clientCredentials' },
  ],
}

// Boolean toggle
{
  displayName: 'Impersonate a User',
  name: 'inpersonate',
  type: 'boolean',
  default: false,
}

// Notice/warning text
{
  displayName: 'Warning message here',
  name: 'httpWarning',
  type: 'notice',
  default: '',
}
```
- Password masking for sensitive fields
- Dropdown options for predefined choices
- Boolean toggles for feature flags
- Notice fields for user guidance

### 6. Dynamic Option Generation
```typescript
const regions = [
  { name: 'africa-south1', displayName: 'Africa', location: 'Johannesburg' },
  { name: 'asia-east1', displayName: 'Asia Pacific', location: 'Changhua County' },
  // ... more regions
] as const;

{
  displayName: 'Region',
  name: 'region',
  type: 'options',
  options: regions.map((r) => ({
    name: `${r.displayName} (${r.location}) - ${r.name}`,
    value: r.name,
  })),
  default: 'us-central1',
}
```
- Dynamic option generation from data arrays
- Formatted display names with multiple data points
- Const assertion for type safety

### 7. Authentication Method Implementation
```typescript
async authenticate(
  credentials: ICredentialDataDecryptedObject,
  requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
  // Early return if not configured for HTTP node
  if (!credentials.httpNode) return requestOptions;

  // Data preparation and validation
  const privateKey = (credentials.privateKey as string).replace(/\\n/g, '\n').trim();
  const scopes = credentialsScopes.split(/[,\s\n]+/).filter(scope => scope).join(' ');

  // JWT token creation
  const now = moment().unix();
  const signature = jwt.sign({
    iss: credentials.email,
    sub: credentials.delegatedEmail || credentials.email,
    scope: scopes,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }, privateKey, { algorithm: 'RS256' });

  // Token exchange
  const result = await axios({
    method: 'POST',
    url: 'https://oauth2.googleapis.com/token',
    data: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signature,
    }).toString(),
  });

  // Return modified request options
  return {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      Authorization: `Bearer ${result.data.access_token}`,
    },
  };
}
```
- Custom authentication logic for complex flows
- Data sanitization and preparation
- JWT token generation and signing
- HTTP token exchange
- Request option modification

### 8. Credential Security Patterns
```typescript
// Password field masking
{
  typeOptions: { password: true },
}

// Private key handling with newline normalization
const privateKey = (credentials.privateKey as string).replace(/\\n/g, '\n').trim();

// Scope sanitization
const scopes = credentialsScopes
  .split(/[,\s\n]+/)
  .filter((scope) => scope)
  .join(' ');

// Secure token storage and usage
const { access_token } = result.data;
```
- Proper password field masking
- Secure handling of private keys
- Input sanitization and validation
- Token extraction and usage

### 9. User Experience Patterns
```typescript
// Helpful placeholders
{
  placeholder: 'name@email.com',
  placeholder: '-----BEGIN PRIVATE KEY-----\nXIYEvQIBADANBg<...>0IhA7TMoGYPQc=\n-----END PRIVATE KEY-----\n',
}

// Descriptive help text
{
  description: 'The Google Service account similar to user-808@project.iam.gserviceaccount.com',
  description: 'Enter the private key located in the JSON file downloaded from Google Cloud Console',
}

// Warning notices
{
  displayName: "When using the HTTP Request node, you must specify the scopes you want to send. In other nodes, they're added automatically",
  type: 'notice',
}
```
- Clear placeholder examples
- Helpful descriptions and guidance
- Warning notices for important information

### 10. Implementation Patterns
- **Simple Credentials**: Basic structure with minimal fields
- **Generic OAuth2**: Reusable OAuth2 implementation
- **Service-Specific**: Custom authentication logic with `authenticate` method
- **Conditional Display**: Progressive disclosure based on user choices
- **Security First**: Proper password masking and data sanitization
- **User Guidance**: Clear descriptions, placeholders, and notices

### 10. Predefined Credential with Manual Injection
```typescript
export class TelegramApi implements ICredentialType {
  name = 'telegramApi';
  displayName = 'Telegram API';
  documentationUrl = 'telegram';
  
  properties: INodeProperties[] = [
    {
      displayName: 'Access Token',
      name: 'accessToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Chat with the bot father to obtain the access token',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.telegram.org',
      description: 'Base URL for Telegram Bot API',
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}/bot{{$credentials.accessToken}}',
      url: '/getMe',
    },
  };
}

// Node usage:
const credentials = await this.getCredentials('telegramApi');
const uri = `${credentials.baseUrl}/file/bot${credentials.accessToken}/${filePath}`;
```
- Service-specific credential without `genericAuth` flag
- No custom `authenticate` method - node handles injection manually
- Built-in credential testing with `/getMe` endpoint
- Simple token-based authentication pattern
- Node constructs API URLs with embedded token

### 11. Implementation Patterns
- **Simple Credentials**: Basic structure with minimal fields
- **Generic OAuth2**: Reusable OAuth2 implementation
- **Service-Specific with authenticate()**: Custom authentication logic (Google)
- **Service-Specific with Manual Injection**: Node handles auth (Telegram)
- **Conditional Display**: Progressive disclosure based on user choices
- **Security First**: Proper password masking and data sanitization
- **User Guidance**: Clear descriptions, placeholders, and notices

### 12. Reusable Patterns for Credential Authors
- Use `genericAuth = true` for reusable credentials across nodes
- Implement `authenticate` method for complex authentication flows
- Use conditional `displayOptions` for progressive disclosure
- Provide clear placeholders and descriptions for user guidance
- Use `typeOptions: { password: true }` for sensitive fields
- Sanitize and validate all input data
- Use notice fields for important warnings or instructions
- Generate dynamic options from data arrays when appropriate
- Handle token refresh and expiration in authenticate method
- Return modified request options with proper authentication headers
- For simple APIs, predefined credentials with manual injection work well
- Include credential test requests for validation
