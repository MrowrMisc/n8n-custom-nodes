# Credential Testing

Credential testing allows users to verify their credentials before using them in a workflow.

## How It Works

You define a `test` block in the credential class:

```ts
test: ICredentialTestRequest = {
  request: {
    baseURL: "={{$credentials.baseUrl}}",
    url: "/me",
    method: "GET",
    headers: {
      Authorization: "Bearer {{$credentials.apiKey}}",
    },
  },
}
```

## Use Cases
- Validate API keys or tokens
- Confirm connectivity to external services
- Provide early feedback to users

## Tips
- Use a lightweight endpoint like `/me` or `/ping`
- Avoid endpoints that mutate data
- Use `{{$credentials.xxx}}` to interpolate values

## Complete Credential Testing Examples

Here are comprehensive examples showing different credential testing patterns:

**Simple API Key Test:**
```ts
import {
  ICredentialType,
  INodeProperties,
  ICredentialTestRequest,
} from 'n8n-workflow';

export class SimpleApiCredentials implements ICredentialType {
  name = 'simpleApiCredentials';
  displayName = 'Simple API Credentials';
  documentationUrl = 'https://docs.example.com/auth';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.example.com',
      required: true,
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/user/profile',
      method: 'GET',
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
      },
    },
  };
}
```

**OAuth2 Token Test:**
```ts
export class OAuth2ApiCredentials implements ICredentialType {
  name = 'oAuth2ApiCredentials';
  extends = ['oAuth2Api'];
  displayName = 'OAuth2 API Credentials';
  documentationUrl = 'https://docs.example.com/oauth';
  properties: INodeProperties[] = [
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'hidden',
      default: 'read:user',
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.example.com',
      url: '/user',
      method: 'GET',
      // OAuth2 token automatically injected by n8n
    },
  };
}
```

**Custom Test with Error Handling:**
```ts
import {
  ICredentialType,
  INodeProperties,
  ICredentialTestRequest,
  ICredentialTestFunctions,
  ICredentialDataDecryptedObject,
} from 'n8n-workflow';

export class AdvancedApiCredentials implements ICredentialType {
  name = 'advancedApiCredentials';
  displayName = 'Advanced API Credentials';
  documentationUrl = 'https://docs.example.com/auth';
  properties: INodeProperties[] = [
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
    },
    {
      displayName: 'Server URL',
      name: 'serverUrl',
      type: 'string',
      default: 'https://api.example.com',
      required: true,
    },
  ];

  async test(
    this: ICredentialTestFunctions,
    credential: ICredentialDataDecryptedObject,
  ): Promise<boolean> {
    const { username, password, serverUrl } = credential;

    try {
      // Custom authentication logic
      const authResponse = await this.helpers.request({
        method: 'POST',
        url: `${serverUrl}/auth/login`,
        body: {
          username,
          password,
        },
        json: true,
      });

      if (!authResponse.token) {
        throw new Error('No authentication token received');
      }

      // Test the token with a protected endpoint
      const testResponse = await this.helpers.request({
        method: 'GET',
        url: `${serverUrl}/user/profile`,
        headers: {
          'Authorization': `Bearer ${authResponse.token}`,
        },
        json: true,
      });

      // Validate response structure
      if (!testResponse.id || !testResponse.email) {
        throw new Error('Invalid user profile response');
      }

      return true;
      
    } catch (error) {
      if (error.statusCode === 401) {
        throw new Error('Invalid username or password');
      }
      
      if (error.statusCode === 403) {
        throw new Error('Account does not have sufficient permissions');
      }
      
      if (error.code === 'ENOTFOUND') {
        throw new Error('Server URL is not reachable. Please check the URL.');
      }
      
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }
}
```

**Database Connection Test:**
```ts
export class DatabaseCredentials implements ICredentialType {
  name = 'databaseCredentials';
  displayName = 'Database Credentials';
  documentationUrl = 'https://docs.example.com/database';
  properties: INodeProperties[] = [
    {
      displayName: 'Host',
      name: 'host',
      type: 'string',
      default: 'localhost',
      required: true,
    },
    {
      displayName: 'Port',
      name: 'port',
      type: 'number',
      default: 5432,
      required: true,
    },
    {
      displayName: 'Database',
      name: 'database',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
    },
  ];

  async test(
    this: ICredentialTestFunctions,
    credential: ICredentialDataDecryptedObject,
  ): Promise<boolean> {
    const { host, port, database, username, password } = credential;

    try {
      // Example using a hypothetical database client
      const { Client } = require('pg'); // PostgreSQL example
      
      const client = new Client({
        host: host as string,
        port: port as number,
        database: database as string,
        user: username as string,
        password: password as string,
        connectionTimeoutMillis: 5000, // 5 second timeout
      });

      await client.connect();
      
      // Test with a simple query
      const result = await client.query('SELECT 1 as test');
      
      await client.end();
      
      if (result.rows[0].test !== 1) {
        throw new Error('Database test query failed');
      }
      
      return true;
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        throw new Error(`Cannot reach database host: ${host}`);
      }
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused. Check if database is running on port ${port}`);
      }
      
      if (error.code === '28P01') {
        throw new Error('Invalid username or password');
      }
      
      if (error.code === '3D000') {
        throw new Error(`Database '${database}' does not exist`);
      }
      
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
}
```

**Multi-Step Validation Test:**
```ts
export class ComplexApiCredentials implements ICredentialType {
  name = 'complexApiCredentials';
  displayName = 'Complex API Credentials';
  documentationUrl = 'https://docs.example.com/auth';
  properties: INodeProperties[] = [
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
    },
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        {
          name: 'Production',
          value: 'production',
        },
        {
          name: 'Sandbox',
          value: 'sandbox',
        },
      ],
      default: 'sandbox',
    },
  ];

  async test(
    this: ICredentialTestFunctions,
    credential: ICredentialDataDecryptedObject,
  ): Promise<boolean> {
    const { clientId, clientSecret, environment } = credential;
    
    const baseUrl = environment === 'production' 
      ? 'https://api.example.com'
      : 'https://sandbox-api.example.com';

    try {
      // Step 1: Get access token
      const tokenResponse = await this.helpers.request({
        method: 'POST',
        url: `${baseUrl}/oauth/token`,
        body: {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        },
        json: true,
      });

      if (!tokenResponse.access_token) {
        throw new Error('Failed to obtain access token');
      }

      // Step 2: Test token with API call
      const apiResponse = await this.helpers.request({
        method: 'GET',
        url: `${baseUrl}/account/info`,
        headers: {
          'Authorization': `Bearer ${tokenResponse.access_token}`,
        },
        json: true,
      });

      // Step 3: Validate account permissions
      if (!apiResponse.permissions || !Array.isArray(apiResponse.permissions)) {
        throw new Error('Account permissions not found');
      }

      const requiredPermissions = ['read', 'write'];
      const hasRequiredPermissions = requiredPermissions.every(
        permission => apiResponse.permissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        throw new Error(
          `Account missing required permissions: ${requiredPermissions.join(', ')}`
        );
      }

      return true;
      
    } catch (error) {
      if (error.statusCode === 401) {
        throw new Error('Invalid client credentials');
      }
      
      if (error.statusCode === 403) {
        throw new Error('Client does not have API access permissions');
      }
      
      throw new Error(`Credential test failed: ${error.message}`);
    }
  }
}
```

These examples demonstrate:
- **Simple tests**: Using the `test.request` property for basic validation
- **Custom tests**: Using the `test()` method for complex validation logic
- **Error handling**: Providing specific error messages for different failure scenarios
- **Multi-step validation**: Testing authentication flow and permissions
- **Environment-specific testing**: Different endpoints based on configuration

Credential testing provides immediate feedback to users and prevents workflow failures due to invalid credentials.
