# Manual Injection Authentication

Some nodes use credentials without `genericAuth` or `authenticate()`. Instead, the node manually injects the credential values into the request.

## Credential Definition

```ts
export class TelegramApi implements ICredentialType {
  name = "telegramApi"
  displayName = "Telegram API"
  properties = [
    {
      displayName: "Access Token",
      name: "accessToken",
      type: "string",
      typeOptions: { password: true },
      default: "",
    },
  ]
}
```

## Node Usage

```ts
const credentials = await this.getCredentials("telegramApi")
const url = `${credentials.baseUrl}/bot${credentials.accessToken}/sendMessage`
```

## Use Cases
- Simple token-based APIs
- Nodes that construct custom URLs or headers

## Tips
- Use `typeOptions: { password: true }` for sensitive fields
- Add a `test` block to validate credentials

## Manual Credential Access in Execute

Here's how to manually access and use credentials in your node's execute method:

**Simple Token Injection:**
```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
} from 'n8n-workflow';

export class TelegramNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Telegram',
    name: 'telegram',
    icon: 'file:telegram.svg',
    group: ['communication'],
    version: 1,
    description: 'Send messages via Telegram Bot API',
    defaults: {
      name: 'Telegram',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'telegramApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Chat ID',
        name: 'chatId',
        type: 'string',
        default: '',
        required: true,
        description: 'The chat ID to send the message to',
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: '',
        required: true,
        description: 'The message to send',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get credentials manually
    const credentials = await this.getCredentials('telegramApi');
    
    if (!credentials) {
      throw new NodeApiError(this.getNode(), {
        message: 'No credentials found',
        description: 'Please configure Telegram API credentials',
      });
    }

    for (let i = 0; i < items.length; i++) {
      const chatId = this.getNodeParameter('chatId', i) as string;
      const message = this.getNodeParameter('message', i) as string;

      try {
        // Manually construct the URL with the token
        const url = `https://api.telegram.org/bot${credentials.accessToken}/sendMessage`;
        
        const response = await this.helpers.request({
          method: 'POST',
          url,
          body: {
            chat_id: chatId,
            text: message,
          },
          json: true,
        });

        returnData.push({
          json: response,
        });
        
      } catch (error) {
        throw new NodeApiError(this.getNode(), error, {
          message: `Failed to send Telegram message to chat ${chatId}`,
          description: error.message,
        });
      }
    }

    return [returnData];
  }
}
```

**Complex Credential Processing:**
```ts
export class CustomApiNode implements INodeType {
  // ... node description ...

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get credentials with type safety
    const credentials = await this.getCredentials('customApi') as {
      apiKey: string;
      secretKey: string;
      baseUrl: string;
      region?: string;
    };

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;
      
      try {
        let requestOptions: any = {
          method: 'GET',
          json: true,
        };

        // Manually construct authentication based on operation
        if (operation === 'listUsers') {
          // Simple API key in header
          requestOptions.url = `${credentials.baseUrl}/users`;
          requestOptions.headers = {
            'X-API-Key': credentials.apiKey,
          };
          
        } else if (operation === 'createUser') {
          // Signed request with secret
          const timestamp = Date.now().toString();
          const signature = this.createSignature(
            credentials.secretKey,
            timestamp,
            'POST',
            '/users'
          );
          
          requestOptions.method = 'POST';
          requestOptions.url = `${credentials.baseUrl}/users`;
          requestOptions.headers = {
            'X-API-Key': credentials.apiKey,
            'X-Timestamp': timestamp,
            'X-Signature': signature,
          };
          requestOptions.body = {
            name: this.getNodeParameter('userName', i),
            email: this.getNodeParameter('userEmail', i),
          };
          
        } else if (operation === 'regionalQuery') {
          // Region-specific endpoint
          const region = credentials.region || 'us-east-1';
          requestOptions.url = `https://${region}.${credentials.baseUrl}/query`;
          requestOptions.headers = {
            'Authorization': `Bearer ${credentials.apiKey}`,
            'X-Region': region,
          };
        }

        const response = await this.helpers.request(requestOptions);
        
        returnData.push({
          json: {
            operation,
            result: response,
            credentials_used: {
              baseUrl: credentials.baseUrl,
              region: credentials.region,
              // Never log sensitive data!
              apiKey: '***',
              secretKey: '***',
            },
          },
        });
        
      } catch (error) {
        throw new NodeApiError(this.getNode(), error, {
          message: `Failed to execute ${operation}`,
          description: error.message,
        });
      }
    }

    return [returnData];
  }

  private createSignature(
    secretKey: string,
    timestamp: string,
    method: string,
    path: string
  ): string {
    // Example signature creation (adjust for your API)
    const crypto = require('crypto');
    const message = `${method}${path}${timestamp}`;
    return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
  }
}
```

**Credential Validation:**
```ts
export class ValidatedApiNode implements INodeType {
  // ... node description ...

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get and validate credentials
    const credentials = await this.getCredentials('myApi');
    
    // Validate required fields
    if (!credentials.apiKey) {
      throw new NodeApiError(this.getNode(), {
        message: 'API Key is required',
        description: 'Please provide a valid API key in the credentials',
      });
    }
    
    if (!credentials.baseUrl) {
      throw new NodeApiError(this.getNode(), {
        message: 'Base URL is required',
        description: 'Please provide the API base URL in the credentials',
      });
    }

    // Validate URL format
    try {
      new URL(credentials.baseUrl as string);
    } catch {
      throw new NodeApiError(this.getNode(), {
        message: 'Invalid Base URL',
        description: 'The provided base URL is not a valid URL format',
      });
    }

    for (let i = 0; i < items.length; i++) {
      try {
        const response = await this.helpers.request({
          method: 'GET',
          url: `${credentials.baseUrl}/data`,
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
          },
          json: true,
        });

        returnData.push({ json: response });
        
      } catch (error) {
        if (error.statusCode === 401) {
          throw new NodeApiError(this.getNode(), {
            message: 'Authentication failed',
            description: 'The provided API key is invalid or expired',
          });
        }
        
        throw new NodeApiError(this.getNode(), error);
      }
    }

    return [returnData];
  }
}
```

These examples show:
- **Simple token injection**: Manually adding tokens to URLs or headers
- **Complex processing**: Different auth methods based on operation
- **Credential validation**: Checking required fields and formats
- **Error handling**: Proper error messages for auth failures

Use manual injection when you need fine-grained control over how credentials are used in requests.
