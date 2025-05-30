# HttpRequestV3 Node - Implementation Patterns

## Key Learning Points

### 1. Comprehensive Authentication Support
```typescript
let authentication = this.getNodeParameter('authentication', 0) as
  | 'predefinedCredentialType'
  | 'genericCredentialType'
  | 'none';

// Multiple credential types supported
let httpBasicAuth, httpBearerAuth, httpDigestAuth, httpHeaderAuth;
let httpQueryAuth, httpCustomAuth, oAuth1Api, oAuth2Api, sslCertificates;

if (authentication === 'genericCredentialType') {
  const genericCredentialType = this.getNodeParameter('genericAuthType', 0) as string;
  
  if (genericCredentialType === 'httpBasicAuth') {
    httpBasicAuth = await this.getCredentials('httpBasicAuth', itemIndex);
  }
  // ... handle other auth types
}
```
- Multiple authentication strategies in single node
- Generic vs predefined credential types
- Per-item credential loading
- Comprehensive auth method coverage

### 2. Advanced Request Configuration
```typescript
const {
  redirect,
  batching,
  proxy,
  timeout,
  allowUnauthorizedCerts,
  queryParameterArrays,
  response,
  lowercaseHeaders,
} = this.getNodeParameter('options', itemIndex, {});

requestOptions = {
  headers: {},
  method: requestMethod,
  uri: url,
  gzip: true,
  rejectUnauthorized: !allowUnauthorizedCerts || false,
  followRedirect: false,
  resolveWithFullResponse: true,
  timeout: timeout || 300_000, // 5 minute default
};
```
- Comprehensive request option handling
- Sensible defaults (5-minute timeout, gzip enabled)
- Security options (certificate validation)
- Performance options (batching, redirects)

### 3. Flexible Body Content Types
```typescript
if (sendBody && ['PATCH', 'POST', 'PUT', 'GET'].includes(requestMethod)) {
  if (bodyContentType === 'multipart-form-data') {
    requestOptions.formData = requestOptions.body as IDataObject;
    delete requestOptions.body;
  } else if (bodyContentType === 'form-urlencoded') {
    requestOptions.form = requestOptions.body as IDataObject;
    delete requestOptions.body;
  } else if (bodyContentType === 'binaryData') {
    const itemBinaryData = this.helpers.assertBinaryData(itemIndex, inputDataFieldName);
    let uploadData: Buffer | Readable;
    
    if (itemBinaryData.id) {
      uploadData = await this.helpers.getBinaryStream(itemBinaryData.id);
    } else {
      uploadData = Buffer.from(itemBinaryData.data, BINARY_ENCODING);
    }
    
    requestOptions.body = uploadData;
    requestOptions.headers = {
      ...requestOptions.headers,
      'content-length': contentLength,
      'content-type': itemBinaryData.mimeType ?? 'application/octet-stream',
    };
  }
}
```
- Multiple body content type support
- Binary data handling with proper headers
- Form data vs URL-encoded distinction
- Stream vs buffer binary handling

### 4. Dynamic Parameter Processing
```typescript
const parametersToKeyValue = async (
  accumulator: { [key: string]: any },
  cur: { name: string; value: string; parameterType?: string; inputDataFieldName?: string },
) => {
  if (cur.parameterType === 'formBinaryData') {
    if (!cur.inputDataFieldName) return accumulator;
    const binaryData = this.helpers.assertBinaryData(itemIndex, cur.inputDataFieldName);
    
    let uploadData: Buffer | Readable;
    const itemBinaryData = items[itemIndex].binary![cur.inputDataFieldName];
    
    if (itemBinaryData.id) {
      uploadData = await this.helpers.getBinaryStream(itemBinaryData.id);
    } else {
      uploadData = Buffer.from(itemBinaryData.data, BINARY_ENCODING);
    }

    accumulator[cur.name] = {
      value: uploadData,
      options: {
        filename: binaryData.fileName,
        contentType: binaryData.mimeType,
      },
    };
    return accumulator;
  }
  accumulator[cur.name] = cur.value;
  return accumulator;
};
```
- Flexible parameter processing function
- Binary file upload support in forms
- Proper file metadata handling
- Async parameter reduction

### 5. Advanced Pagination Support
```typescript
const pagination = this.getNodeParameter('options.pagination.pagination', 0, null) as {
  paginationMode: 'off' | 'updateAParameterInEachRequest' | 'responseContainsNextURL';
  nextURL?: string;
  parameters: { parameters: Array<{ type: 'body' | 'headers' | 'qs'; name: string; value: string; }> };
  paginationCompleteWhen: 'responseIsEmpty' | 'receiveSpecificStatusCodes' | 'other';
  statusCodesWhenComplete: string;
  completeExpression: string;
  limitPagesFetched: boolean;
  maxRequests: number;
  requestInterval: number;
};

let continueExpression = '={{false}}';
if (pagination.paginationCompleteWhen === 'receiveSpecificStatusCodes') {
  const statusCodesWhenCompleted = pagination.statusCodesWhenComplete
    .split(',')
    .map((item) => parseInt(item.trim()));
  
  continueExpression = `={{ !${JSON.stringify(statusCodesWhenCompleted)}.includes($response.statusCode) }}`;
}
```
- Multiple pagination strategies
- Expression-based completion conditions
- Parameter-based vs URL-based pagination
- Rate limiting with request intervals

### 6. Response Format Auto-Detection
```typescript
const responseContentType = response.headers['content-type'] ?? '';
if (autoDetectResponseFormat) {
  if (responseContentType.includes('application/json')) {
    responseFormat = 'json';
    if (!response.__bodyResolved) {
      const data = await this.helpers.binaryToString(response.body as Buffer | Readable);
      response.body = jsonParse(data, {
        ...(neverError
          ? { fallbackValue: {} }
          : { errorMessage: 'Invalid JSON in response body' }),
      });
    }
  } else if (binaryContentTypes.some((e) => responseContentType.includes(e))) {
    responseFormat = 'file';
  } else {
    responseFormat = 'text';
    const data = await this.helpers.binaryToString(response.body as Buffer | Readable);
    response.body = !data ? undefined : data;
  }
}
```
- Content-type based format detection
- Graceful JSON parsing with fallbacks
- Binary content type recognition
- Stream to string conversion

### 7. Batching and Rate Limiting
```typescript
const batchSize = batching?.batch?.batchSize > 0 ? batching?.batch?.batchSize : 1;
const batchInterval = batching?.batch.batchInterval;

if (itemIndex > 0 && batchSize >= 0 && batchInterval > 0) {
  if (itemIndex % batchSize === 0) {
    await sleep(batchInterval);
  }
}
```
- Configurable batch processing
- Rate limiting between batches
- Performance optimization for bulk requests
- Prevents API rate limit violations

### 8. Security and Credential Sanitization
```typescript
const authDataKeys: IAuthDataSanitizeKeys = {};

// Track sensitive data for sanitization
if (httpBasicAuth !== undefined) {
  requestOptions.auth = {
    user: httpBasicAuth.user as string,
    pass: httpBasicAuth.password as string,
  };
  authDataKeys.auth = ['pass'];
}

// Later in execution
const secrets: string[] = getSecrets(properties, credentials);
const sanitizedRequestOptions = sanitizeUiMessage(options, authKeys, secrets);
this.sendMessageToUI(sanitizedRequestOptions);
```
- Comprehensive credential sanitization
- UI message security
- Secret detection and masking
- Debug information safety

### 9. Error Handling and Recovery
```typescript
const promisesResponses = await Promise.allSettled(requestPromises);

for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
  responseData = promisesResponses.shift();
  
  if (responseData!.status !== 'fulfilled') {
    if (responseData.reason.statusCode === 429) {
      responseData.reason.message = "Try spacing your requests out using the batching settings under 'Options'";
    }
    
    if (!this.continueOnFail()) {
      let error;
      if (responseData?.reason instanceof NodeApiError) {
        error = responseData.reason;
        set(error, 'context.itemIndex', itemIndex);
      } else {
        error = new NodeApiError(this.getNode(), errorData, { itemIndex });
      }
      set(error, 'context.request', sanitizedRequests[itemIndex]);
      throw error;
    }
  }
}
```
- Promise.allSettled for parallel execution
- Specific error message improvements (429 rate limiting)
- Context-rich error information
- Continue-on-fail with detailed error items

### 10. Response Optimization
```typescript
// This is a no-op outside of tool usage
const optimizeResponse = configureResponseOptimizer(this, itemIndex);

if (!fullResponse) {
  response = optimizeResponse(response.body);
} else {
  response.body = optimizeResponse(response.body);
}

if (Array.isArray(response)) {
  response.forEach((item) =>
    returnItems.push({
      json: item,
      pairedItem: { item: itemIndex },
    }),
  );
} else {
  returnItems.push({
    json: response,
    pairedItem: { item: itemIndex },
  });
}
```
- Response optimization for tool usage
- Array response flattening
- Proper item pairing
- Full vs body-only response modes

### 11. Implementation Patterns
- **Multi-Auth Support**: Comprehensive authentication strategy handling
- **Content Type Flexibility**: Multiple body and response formats
- **Advanced Pagination**: Multiple pagination strategies with expressions
- **Security First**: Credential sanitization and secret management
- **Performance Optimization**: Batching, rate limiting, parallel execution
- **Error Recovery**: Detailed error context and continue-on-fail

### 12. Reusable Patterns
- Use Promise.allSettled for parallel request execution
- Implement comprehensive authentication strategy switching
- Support multiple content types with proper header management
- Provide advanced pagination with expression-based completion
- Implement response format auto-detection based on content-type
- Use batching and rate limiting for API-friendly bulk operations
- Sanitize sensitive data in debug output
- Provide detailed error context with request information
- Support both full response and body-only modes
- Handle binary data with proper stream/buffer management
- Implement flexible parameter processing for different data types
- Use sensible defaults for timeout and other options
