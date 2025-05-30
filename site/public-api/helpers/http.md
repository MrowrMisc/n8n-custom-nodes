# HTTP Helpers

HTTP helpers provide methods for making HTTP requests with built-in authentication, error handling, and n8n-specific features.

## Available Methods

### <a id="httprequest"></a>`httpRequest(options)`
Makes an HTTP request with modern options and better error handling.

```ts
httpRequest(options: IHttpRequestOptions): Promise<any>
```

**Parameters:**
- `options` - HTTP request configuration

**Example:**
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: {
    'Authorization': 'Bearer token123',
    'Content-Type': 'application/json',
  },
  qs: {
    limit: 10,
    page: 1,
  },
});
```

### <a id="httprequestwithauthentication"></a>`httpRequestWithAuthentication(credentialsType, options, additionalCredentialOptions?)`
Makes an HTTP request with automatic credential authentication.

```ts
httpRequestWithAuthentication(
  this: IAllExecuteFunctions,
  credentialsType: string,
  requestOptions: IHttpRequestOptions,
  additionalCredentialOptions?: IAdditionalCredentialOptions,
): Promise<any>
```

**Parameters:**
- `credentialsType` - Type of credentials to use
- `requestOptions` - HTTP request configuration
- `additionalCredentialOptions` - Additional credential options

**Example:**
```ts
// Using OAuth2 credentials
const response = await this.helpers.httpRequestWithAuthentication(
  'googleOAuth2Api',
  {
    method: 'GET',
    url: 'https://www.googleapis.com/drive/v3/files',
  }
);

// Using API key credentials
const response = await this.helpers.httpRequestWithAuthentication(
  'slackApi',
  {
    method: 'POST',
    url: 'https://slack.com/api/chat.postMessage',
    body: {
      channel: '#general',
      text: 'Hello from n8n!',
    },
  }
);
```

## Request Options

### `IHttpRequestOptions`
Configuration object for HTTP requests.

```ts
interface IHttpRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
  headers?: IDataObject;
  body?: any;
  qs?: IDataObject;
  json?: boolean;
  returnFullResponse?: boolean;
  ignoreHttpStatusErrors?: boolean;
  timeout?: number;
  encoding?: string;
  skipSslCertificateValidation?: boolean;
  proxy?: ProxyConfig;
  abortSignal?: AbortSignal;
}
```

### Common Options

#### Basic GET Request
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
});
```

#### POST with JSON Body
```ts
const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.example.com/users',
  headers: {
    'Content-Type': 'application/json',
  },
  body: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  json: true, // Automatically stringify body and parse response
});
```

#### Query Parameters
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/search',
  qs: {
    q: 'search term',
    limit: 10,
    offset: 0,
  },
});
```

#### Custom Headers
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: {
    'Authorization': 'Bearer token123',
    'User-Agent': 'n8n-custom-node/1.0',
    'X-Custom-Header': 'value',
  },
});
```

#### Full Response
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  returnFullResponse: true,
});

console.log(response.statusCode); // 200
console.log(response.headers); // Response headers
console.log(response.body); // Response body
```

#### Error Handling
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  ignoreHttpStatusErrors: true, // Don't throw on 4xx/5xx
});

if (response.statusCode >= 400) {
  // Handle error response
  console.log('Error:', response.body);
}
```

#### Timeout
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/slow-endpoint',
  timeout: 30000, // 30 seconds
});
```

#### SSL Certificate Validation
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://self-signed.example.com/api',
  skipSslCertificateValidation: true,
});
```

## Authentication Examples

### OAuth2
```ts
// Credentials are automatically applied
const response = await this.helpers.httpRequestWithAuthentication(
  'googleOAuth2Api',
  {
    method: 'GET',
    url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
  }
);
```

### API Key in Header
```ts
const response = await this.helpers.httpRequestWithAuthentication(
  'openAiApi', // Credential type that adds API key to headers
  {
    method: 'POST',
    url: 'https://api.openai.com/v1/chat/completions',
    body: {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello!' }],
    },
  }
);
```

### Basic Authentication
```ts
const response = await this.helpers.httpRequestWithAuthentication(
  'httpBasicAuth',
  {
    method: 'GET',
    url: 'https://api.example.com/protected',
  }
);
```

### Custom Authentication
```ts
// For credentials that need custom handling
const credentials = await this.getCredentials('customApi');
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: {
    'X-API-Key': credentials.apiKey,
    'X-Secret': credentials.secret,
  },
});
```

## Pagination Helper

### <a id="requestwithauthenticationpaginated"></a>`requestWithAuthenticationPaginated(requestOptions, itemIndex, paginationOptions, credentialsType?, additionalCredentialOptions?)`
Handles paginated API responses automatically.

```ts
requestWithAuthenticationPaginated(
  this: IAllExecuteFunctions,
  requestOptions: IRequestOptions,
  itemIndex: number,
  paginationOptions: PaginationOptions,
  credentialsType?: string,
  additionalCredentialOptions?: IAdditionalCredentialOptions,
): Promise<any[]>
```

**Example:**
```ts
const allResults = await this.helpers.requestWithAuthenticationPaginated(
  {
    method: 'GET',
    url: 'https://api.example.com/users',
    qs: {
      limit: 100,
    },
  },
  0, // itemIndex
  {
    continue: true,
    request: {
      qs: {
        page: '={{$response.nextPage}}',
      },
    },
    requestInterval: 1000, // 1 second between requests
    maxRequests: 10, // Maximum 10 requests
  },
  'apiKeyAuth'
);
```

## Error Handling

### HTTP Status Errors
```ts
try {
  const response = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://api.example.com/data',
  });
} catch (error) {
  if (error.response) {
    // HTTP error response
    console.log('Status:', error.response.status);
    console.log('Body:', error.response.body);
  } else {
    // Network or other error
    console.log('Error:', error.message);
  }
}
```

### Graceful Error Handling
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  ignoreHttpStatusErrors: true,
  returnFullResponse: true,
});

if (response.statusCode >= 200 && response.statusCode < 300) {
  // Success
  return response.body;
} else {
  // Handle error gracefully
  return {
    error: true,
    statusCode: response.statusCode,
    message: response.body?.message || 'Request failed',
  };
}
```

## Advanced Examples

### File Upload
```ts
import FormData from 'form-data';

const formData = new FormData();
formData.append('file', buffer, 'filename.pdf');
formData.append('description', 'Uploaded via n8n');

const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.example.com/upload',
  body: formData,
  headers: formData.getHeaders(),
});
```

### Binary Response
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/download/file.pdf',
  encoding: 'arraybuffer', // Get binary data
  returnFullResponse: true,
});

const binaryData = await this.helpers.prepareBinaryData(
  Buffer.from(response.body),
  'downloaded-file.pdf',
  'application/pdf'
);
```

### Retry Logic
```ts
async function makeRequestWithRetry(
  this: IExecuteFunctions,
  options: IHttpRequestOptions,
  maxRetries = 3
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.helpers.httpRequest(options);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Rate Limiting
```ts
class RateLimiter {
  private lastRequest = 0;
  private minInterval = 1000; // 1 second between requests

  async makeRequest(this: IExecuteFunctions, options: IHttpRequestOptions) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      const delay = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequest = Date.now();
    return this.helpers.httpRequest(options);
  }
}
```

## Best Practices

### 1. Use Type-Safe Responses
```ts
interface ApiResponse {
  data: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  pagination: {
    page: number;
    total: number;
  };
}

const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/users',
}) as ApiResponse;

// TypeScript now knows the structure
response.data.forEach(user => {
  console.log(user.name); // Type-safe access
});
```

### 2. Handle Different Response Types
```ts
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: endpoint,
  returnFullResponse: true,
});

const contentType = response.headers['content-type'];

if (contentType?.includes('application/json')) {
  return JSON.parse(response.body);
} else if (contentType?.includes('text/')) {
  return response.body;
} else {
  // Binary data
  return this.helpers.prepareBinaryData(
    Buffer.from(response.body),
    'response-data'
  );
}
```

### 3. Validate Responses
```ts
const response = await this.helpers.httpRequest(options);

if (!response || typeof response !== 'object') {
  throw new NodeOperationError(
    this.getNode(),
    'Invalid response from API'
  );
}

if (!response.data || !Array.isArray(response.data)) {
  throw new NodeOperationError(
    this.getNode(),
    'Expected array in response.data'
  );
}
```

### 4. Use Appropriate Timeouts
```ts
// Short timeout for health checks
const healthCheck = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/health',
  timeout: 5000, // 5 seconds
});

// Longer timeout for data processing
const processData = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.example.com/process',
  body: largeDataset,
  timeout: 300000, // 5 minutes
});
```

## Deprecated Methods

### ⚠️ `request()` - Deprecated
Use `httpRequest()` instead for new code.

```ts
// ❌ Deprecated
const response = await this.helpers.request('https://api.example.com');

// ✅ Preferred
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com',
});
```

### ⚠️ `requestWithAuthentication()` - Deprecated
Use `httpRequestWithAuthentication()` instead.

```ts
// ❌ Deprecated
const response = await this.helpers.requestWithAuthentication(
  'credentialType',
  { uri: 'https://api.example.com' }
);

// ✅ Preferred
const response = await this.helpers.httpRequestWithAuthentication(
  'credentialType',
  { url: 'https://api.example.com' }
);
```

## See Also

- [IExecuteFunctions](../execution-contexts/IExecuteFunctions) - Main execution context
- [Binary Helpers](./binary) - Working with binary data
- [Credential Patterns](../../credential-patterns/APIKey.md) - Authentication patterns
- [Error Handling](../../advanced/ErrorHandling) - Robust error management
