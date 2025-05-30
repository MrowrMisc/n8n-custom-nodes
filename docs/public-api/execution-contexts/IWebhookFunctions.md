# IWebhookFunctions

The execution context for webhook nodes that handle incoming HTTP requests. This interface is used when your node needs to receive and process webhook data from external services.

## When to Use

Use `IWebhookFunctions` when:
- Creating webhook receiver nodes
- Building HTTP endpoint handlers
- Processing incoming API callbacks
- Handling form submissions or file uploads

## Interface Definition

```ts
interface IWebhookFunctions extends IExecuteFunctions {
  getBodyData(): IDataObject;
  getHeaderData(): IncomingHttpHeaders;
  getNodeWebhookUrl(name: string): string | undefined;
  getParamsData(): object;
  getQueryData(): object;
  getRequestObject(): express.Request;
  getResponseObject(): express.Response;
  getWebhookName(): string;
  prepareOutputData(outputData: INodeExecutionData[]): Promise<INodeExecutionData[]>;
  helpers: IWebhookFunctionsHelpers;
}
```

## Core Methods

### getBodyData()

Retrieves the parsed request body data.

```ts
getBodyData(): IDataObject
```

**Returns:** Parsed body data as an object

### getHeaderData()

Gets all HTTP headers from the incoming request.

```ts
getHeaderData(): IncomingHttpHeaders
```

**Returns:** Object containing all request headers

### getQueryData()

Retrieves query string parameters from the request URL.

```ts
getQueryData(): object
```

**Returns:** Object containing query parameters

### getParamsData()

Gets URL path parameters from the request.

```ts
getParamsData(): object
```

**Returns:** Object containing URL parameters

### getRequestObject()

Returns the raw Express.js request object for advanced use cases.

```ts
getRequestObject(): express.Request
```

**Returns:** Express request object

### getResponseObject()

Returns the Express.js response object for custom response handling.

```ts
getResponseObject(): express.Response
```

**Returns:** Express response object

### getWebhookName()

Gets the name of the webhook being processed.

```ts
getWebhookName(): string
```

**Returns:** The webhook name

### getNodeWebhookUrl()

Gets the full URL for a specific webhook endpoint.

```ts
getNodeWebhookUrl(name: string): string | undefined
```

**Parameters:**
- `name` - The webhook name

**Returns:** Full webhook URL or undefined

## Implementation Example

```ts
import {
  IWebhookFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
  NodeOperationError,
} from 'n8n-workflow';

export class CustomWebhook implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Custom Webhook',
    name: 'customWebhook',
    icon: 'fa:satellite-dish',
    group: ['trigger'],
    version: 1,
    description: 'Receives and processes webhook data',
    defaults: {
      name: 'Custom Webhook',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Response Mode',
        name: 'responseMode',
        type: 'options',
        options: [
          {
            name: 'On Received',
            value: 'onReceived',
            description: 'Respond immediately when webhook is received',
          },
          {
            name: 'Last Node',
            value: 'lastNode',
            description: 'Respond with data from the last node',
          },
        ],
        default: 'onReceived',
      },
      {
        displayName: 'Response Code',
        name: 'responseCode',
        type: 'number',
        default: 200,
        description: 'HTTP status code to return',
      },
      {
        displayName: 'Response Data',
        name: 'responseData',
        type: 'string',
        default: 'success',
        description: 'Response body to return',
      },
      {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'options',
        options: [
          { name: 'None', value: 'none' },
          { name: 'Header Auth', value: 'headerAuth' },
          { name: 'Query Auth', value: 'queryAuth' },
        ],
        default: 'none',
      },
      {
        displayName: 'Auth Header Name',
        name: 'authHeaderName',
        type: 'string',
        default: 'Authorization',
        displayOptions: {
          show: {
            authentication: ['headerAuth'],
          },
        },
      },
      {
        displayName: 'Auth Header Value',
        name: 'authHeaderValue',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            authentication: ['headerAuth'],
          },
        },
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const authentication = this.getNodeParameter('authentication', 0) as string;
    const responseCode = this.getNodeParameter('responseCode', 0) as number;
    const responseData = this.getNodeParameter('responseData', 0) as string;

    try {
      // Authenticate the request
      if (!this.authenticateRequest(authentication)) {
        return {
          webhookResponse: {
            status: 401,
            body: 'Unauthorized',
          },
        };
      }

      // Get request data
      const body = this.getBodyData();
      const headers = this.getHeaderData();
      const query = this.getQueryData();
      const params = this.getParamsData();

      // Process the webhook data
      const webhookData = this.processWebhookData(body, headers, query, params);

      // Prepare execution data
      const executionData: INodeExecutionData[] = [{
        json: webhookData,
      }];

      return {
        workflowData: [executionData],
        webhookResponse: {
          status: responseCode,
          body: responseData,
        },
      };
    } catch (error) {
      throw new NodeOperationError(
        this.getNode(),
        `Webhook processing failed: ${error.message}`
      );
    }
  }

  private authenticateRequest(authType: string): boolean {
    switch (authType) {
      case 'none':
        return true;
      
      case 'headerAuth':
        const expectedHeader = this.getNodeParameter('authHeaderName', 0) as string;
        const expectedValue = this.getNodeParameter('authHeaderValue', 0) as string;
        const headers = this.getHeaderData();
        
        return headers[expectedHeader.toLowerCase()] === expectedValue;
      
      case 'queryAuth':
        const query = this.getQueryData() as any;
        const token = this.getNodeParameter('authToken', 0) as string;
        
        return query.token === token;
      
      default:
        return false;
    }
  }

  private processWebhookData(
    body: any,
    headers: any,
    query: any,
    params: any
  ): any {
    return {
      body,
      headers,
      query,
      params,
      timestamp: new Date().toISOString(),
      webhookName: this.getWebhookName(),
      webhookUrl: this.getNodeWebhookUrl('default'),
    };
  }
}
```

## Common Patterns

### File Upload Webhook

```ts
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const req = this.getRequestObject();
  const res = this.getResponseObject();

  try {
    // Handle multipart form data
    if (!req.is('multipart/form-data')) {
      return {
        webhookResponse: {
          status: 400,
          body: 'Expected multipart/form-data',
        },
      };
    }

    // Process uploaded files
    const files = await this.processFileUploads(req);
    const formData = this.getBodyData();

    const executionData: INodeExecutionData[] = files.map((file, index) => ({
      json: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        formData,
        uploadedAt: new Date().toISOString(),
      },
      binary: {
        data: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype,
          fileName: file.originalname,
        },
      },
    }));

    return {
      workflowData: [executionData],
      webhookResponse: {
        status: 200,
        body: { message: 'Files uploaded successfully', count: files.length },
      },
    };
  } catch (error) {
    return {
      webhookResponse: {
        status: 500,
        body: { error: error.message },
      },
    };
  }
}

private async processFileUploads(req: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const multer = require('multer');
    const upload = multer({ storage: multer.memoryStorage() });
    
    upload.array('files')(req, null, (error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(req.files || []);
      }
    });
  });
}
```

### JSON API Webhook

```ts
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const headers = this.getHeaderData();
  const body = this.getBodyData();

  try {
    // Validate content type
    if (!headers['content-type']?.includes('application/json')) {
      return {
        webhookResponse: {
          status: 400,
          body: { error: 'Content-Type must be application/json' },
        },
      };
    }

    // Validate required fields
    const validation = this.validatePayload(body);
    if (!validation.valid) {
      return {
        webhookResponse: {
          status: 400,
          body: { error: 'Validation failed', details: validation.errors },
        },
      };
    }

    // Process the data
    const processedData = this.transformPayload(body);

    const executionData: INodeExecutionData[] = [{
      json: {
        ...processedData,
        receivedAt: new Date().toISOString(),
        source: headers['user-agent'] || 'unknown',
      },
    }];

    return {
      workflowData: [executionData],
      webhookResponse: {
        status: 200,
        body: { 
          message: 'Webhook processed successfully',
          id: processedData.id,
        },
      },
    };
  } catch (error) {
    return {
      webhookResponse: {
        status: 500,
        body: { error: 'Internal server error' },
      },
    };
  }
}

private validatePayload(payload: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!payload.id) {
    errors.push('Missing required field: id');
  }

  if (!payload.event) {
    errors.push('Missing required field: event');
  }

  if (!payload.data) {
    errors.push('Missing required field: data');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

private transformPayload(payload: any): any {
  return {
    id: payload.id,
    event: payload.event,
    data: payload.data,
    metadata: {
      version: payload.version || '1.0',
      timestamp: payload.timestamp || new Date().toISOString(),
    },
  };
}
```

### GitHub Webhook Handler

```ts
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const headers = this.getHeaderData();
  const body = this.getBodyData();
  const signature = headers['x-hub-signature-256'] as string;

  try {
    // Verify GitHub signature
    if (!this.verifyGitHubSignature(body, signature)) {
      return {
        webhookResponse: {
          status: 401,
          body: 'Invalid signature',
        },
      };
    }

    const event = headers['x-github-event'] as string;
    const delivery = headers['x-github-delivery'] as string;

    // Process different GitHub events
    const processedData = this.processGitHubEvent(event, body);

    const executionData: INodeExecutionData[] = [{
      json: {
        event,
        delivery,
        ...processedData,
        receivedAt: new Date().toISOString(),
      },
    }];

    return {
      workflowData: [executionData],
      webhookResponse: {
        status: 200,
        body: 'OK',
      },
    };
  } catch (error) {
    return {
      webhookResponse: {
        status: 500,
        body: 'Internal server error',
      },
    };
  }
}

private verifyGitHubSignature(payload: any, signature: string): boolean {
  const crypto = require('crypto');
  const secret = this.getNodeParameter('webhookSecret', 0) as string;
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

private processGitHubEvent(event: string, payload: any): any {
  switch (event) {
    case 'push':
      return {
        repository: payload.repository.full_name,
        branch: payload.ref.replace('refs/heads/', ''),
        commits: payload.commits.length,
        pusher: payload.pusher.name,
      };
    
    case 'pull_request':
      return {
        repository: payload.repository.full_name,
        action: payload.action,
        number: payload.number,
        title: payload.pull_request.title,
        author: payload.pull_request.user.login,
      };
    
    case 'issues':
      return {
        repository: payload.repository.full_name,
        action: payload.action,
        number: payload.issue.number,
        title: payload.issue.title,
        author: payload.issue.user.login,
      };
    
    default:
      return {
        repository: payload.repository?.full_name,
        action: payload.action,
        rawPayload: payload,
      };
  }
}
```

### Slack Webhook Handler

```ts
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const body = this.getBodyData();
  const headers = this.getHeaderData();

  try {
    // Handle Slack URL verification
    if (body.type === 'url_verification') {
      return {
        webhookResponse: {
          status: 200,
          body: { challenge: body.challenge },
        },
      };
    }

    // Verify Slack signature
    if (!this.verifySlackSignature(body, headers)) {
      return {
        webhookResponse: {
          status: 401,
          body: 'Invalid signature',
        },
      };
    }

    // Process Slack event
    const processedData = this.processSlackEvent(body);

    const executionData: INodeExecutionData[] = [{
      json: processedData,
    }];

    return {
      workflowData: [executionData],
      webhookResponse: {
        status: 200,
        body: 'OK',
      },
    };
  } catch (error) {
    return {
      webhookResponse: {
        status: 500,
        body: 'Internal server error',
      },
    };
  }
}

private verifySlackSignature(payload: any, headers: any): boolean {
  const crypto = require('crypto');
  const signingSecret = this.getNodeParameter('signingSecret', 0) as string;
  const timestamp = headers['x-slack-request-timestamp'];
  const signature = headers['x-slack-signature'];

  // Check timestamp to prevent replay attacks
  const time = Math.floor(new Date().getTime() / 1000);
  if (Math.abs(time - timestamp) > 300) {
    return false;
  }

  const baseString = `v0:${timestamp}:${JSON.stringify(payload)}`;
  const expectedSignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

private processSlackEvent(payload: any): any {
  const event = payload.event;
  
  return {
    type: payload.type,
    team: payload.team_id,
    event: {
      type: event.type,
      user: event.user,
      channel: event.channel,
      text: event.text,
      timestamp: event.ts,
    },
    receivedAt: new Date().toISOString(),
  };
}
```

## Response Handling

### Custom Response Headers

```ts
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const res = this.getResponseObject();
  
  // Set custom headers
  res.setHeader('X-Custom-Header', 'custom-value');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  // Process webhook data
  const body = this.getBodyData();
  const executionData: INodeExecutionData[] = [{ json: body }];

  return {
    workflowData: [executionData],
    webhookResponse: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Processed-At': new Date().toISOString(),
      },
      body: { success: true, processed: true },
    },
  };
}
```

### Streaming Response

```ts
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const res = this.getResponseObject();
  
  // Set headers for streaming
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  // Start streaming response
  res.write('Processing started...\n');
  
  // Process data in chunks
  const body = this.getBodyData();
  const items = body.items || [];
  
  for (let i = 0; i < items.length; i++) {
    // Process item
    await this.processItem(items[i]);
    
    // Send progress update
    res.write(`Processed item ${i + 1}/${items.length}\n`);
  }
  
  res.write('Processing completed!\n');
  res.end();

  // Return execution data
  const executionData: INodeExecutionData[] = [{
    json: {
      processed: items.length,
      completedAt: new Date().toISOString(),
    },
  }];

  return {
    workflowData: [executionData],
    noWebhookResponse: true, // Response already sent
  };
}
```

## Error Handling

### Graceful Error Responses

```ts
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  try {
    const body = this.getBodyData();
    
    // Validate input
    if (!body || Object.keys(body).length === 0) {
      return {
        webhookResponse: {
          status: 400,
          body: {
            error: 'Bad Request',
            message: 'Request body is required',
            code: 'MISSING_BODY',
          },
        },
      };
    }

    // Process data
    const result = await this.processWebhookData(body);
    
    return {
      workflowData: [[{ json: result }]],
      webhookResponse: {
        status: 200,
        body: { success: true, data: result },
      },
    };
  } catch (error) {
    // Log error for debugging
    console.error('Webhook processing error:', error);
    
    // Return appropriate error response
    if (error.name === 'ValidationError') {
      return {
        webhookResponse: {
          status: 400,
          body: {
            error: 'Validation Error',
            message: error.message,
            code: 'VALIDATION_FAILED',
          },
        },
      };
    }
    
    if (error.name === 'AuthenticationError') {
      return {
        webhookResponse: {
          status: 401,
          body: {
            error: 'Authentication Error',
            message: 'Invalid credentials',
            code: 'AUTH_FAILED',
          },
        },
      };
    }
    
    // Generic error response
    return {
      webhookResponse: {
        status: 500,
        body: {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR',
        },
      },
    };
  }
}
```

## Best Practices

### 1. Always Validate Input

```ts
private validateWebhookData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!data.id) errors.push('Missing required field: id');
  if (!data.type) errors.push('Missing required field: type');
  
  // Validate data types
  if (data.timestamp && !this.isValidTimestamp(data.timestamp)) {
    errors.push('Invalid timestamp format');
  }
  
  // Validate business rules
  if (data.amount && data.amount < 0) {
    errors.push('Amount must be positive');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 2. Implement Proper Security

```ts
private authenticateWebhook(): boolean {
  const headers = this.getHeaderData();
  const authHeader = headers.authorization;
  
  if (!authHeader) {
    return false;
  }
  
  const token = authHeader.replace('Bearer ', '');
  const expectedToken = this.getNodeParameter('authToken', 0) as string;
  
  return token === expectedToken;
}
```

### 3. Use Type Safety

```ts
interface WebhookPayload {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: string;
}

async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const body = this.getBodyData() as WebhookPayload;
  
  // Type-safe processing
  const executionData: INodeExecutionData[] = [{
    json: {
      id: body.id,
      type: body.type,
      data: body.data,
      processedAt: new Date().toISOString(),
    },
  }];
  
  return {
    workflowData: [executionData],
    webhookResponse: {
      status: 200,
      body: { success: true },
    },
  };
}
```

## See Also

- **[ITriggerFunctions](./ITriggerFunctions)** - Event-driven triggers
- **[IExecuteFunctions](./IExecuteFunctions)** - Main execution context
- **[HTTP Helpers](../helpers/http)** - Making HTTP requests
- **[Binary Data](../../advanced/BinaryData)** - Handling file uploads
