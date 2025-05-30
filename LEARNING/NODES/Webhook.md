# Webhook Node - Implementation Patterns

## Key Learning Points

### 1. Trigger Node Structure
- Extends `Node` class instead of implementing `INodeType`
- Uses `webhook()` method instead of `execute()`
- No inputs, dynamic outputs based on configuration

### 2. Webhook-Specific Properties
```typescript
description: INodeTypeDescription = {
  group: ['trigger'],
  eventTriggerDescription: 'Waiting for you to call the Test URL',
  activationMessage: 'You can now make calls to your production webhook URL.',
  supportsCORS: true,
  webhooks: [defaultWebhookDescription],
  inputs: [],
  outputs: `={{(${configuredOutputs})($parameter)}}`,
}
```

### 3. Dynamic Outputs
```typescript
outputs: `={{(${configuredOutputs})($parameter)}}`
```
- Uses expression to calculate outputs based on parameters
- Allows conditional output connections

### 4. Trigger Panel Configuration
```typescript
triggerPanel: {
  header: '',
  executionsHelp: {
    inactive: 'Webhooks have two modes: test and production...',
    active: 'Since the workflow is activated...'
  },
  activationHint: "Once you've finished building your workflow..."
}
```
- Provides user guidance for trigger nodes
- Different messages for active/inactive states

### 5. Webhook Method Implementation
```typescript
async webhook(context: IWebhookFunctions): Promise<IWebhookResponseData>
```
- Main entry point for webhook execution
- Returns `IWebhookResponseData` instead of `INodeExecutionData[][]`

### 6. Request Processing Pipeline
```typescript
// 1. IP Whitelisting
if (!isIpWhitelisted(options.ipWhitelist, req.ips, req.ip)) {
  resp.writeHead(403);
  resp.end('IP is not whitelisted to access the webhook!');
  return { noWebhookResponse: true };
}

// 2. Bot Detection
if (options.ignoreBots && isbot(req.headers['user-agent']))
  throw new WebhookAuthorizationError(403);

// 3. Authentication
validationData = await this.validateAuth(context);

// 4. Content Processing
if (options.binaryData) {
  return await this.handleBinaryData(context, prepareOutput);
}
```

### 7. Multiple Content Type Handling
- **Binary Data**: Streams to temporary file
- **Form Data**: Processes multipart uploads
- **JSON/Raw**: Standard body parsing
- **Auto-detection**: Falls back to binary if no body

### 8. Binary File Processing
```typescript
const binaryFile = await tmpFile({ prefix: 'n8n-webhook-' });
await pipeline(req, createWriteStream(binaryFile.path));
const binaryData = await context.nodeHelpers.copyBinaryFile(
  binaryFile.path,
  fileName,
  req.contentType ?? 'application/octet-stream',
);
```
- Uses temporary files for large uploads
- Proper cleanup with try/finally

### 9. Authentication Integration
```typescript
authPropertyName = 'authentication';
credentials: credentialsProperty(this.authPropertyName),

private async validateAuth(context: IWebhookFunctions) {
  return await validateWebhookAuthentication(context, this.authPropertyName);
}
```
- Configurable authentication property name
- Delegated authentication validation

### 10. Error Handling
```typescript
try {
  validationData = await this.validateAuth(context);
} catch (error) {
  if (error instanceof WebhookAuthorizationError) {
    resp.writeHead(error.responseCode, { 'WWW-Authenticate': 'Basic realm="Webhook"' });
    resp.end(error.message);
    return { noWebhookResponse: true };
  }
  throw error;
}
```
- Custom error types for webhook-specific errors
- Proper HTTP response handling

### 11. Implementation Patterns
- **Trigger Nodes**: Extend `Node`, implement `webhook()` method
- **Content Handling**: Support multiple content types with fallbacks
- **Security**: IP whitelisting, bot detection, authentication
- **File Processing**: Stream large files to temporary storage
- **Response Control**: Return `noWebhookResponse` to prevent default response

### 12. Reusable Patterns
- Use `triggerPanel` for user guidance in trigger nodes
- Implement security checks early in webhook processing
- Handle different content types with separate methods
- Use temporary files for binary data processing
- Delegate authentication to utility functions
- Return appropriate webhook response objects
