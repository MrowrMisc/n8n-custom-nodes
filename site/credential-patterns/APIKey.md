# API Key Authentication

API key credentials are one of the simplest forms of authentication. The key is usually passed in a header or query parameter.

## Credential Definition

```ts
export class ApiKeyAuth implements ICredentialType {
  name = "apiKeyAuth"
  displayName = "API Key Auth"
  properties = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      default: "",
    },
  ]
  authenticate = {
    type: "generic",
    properties: {
      headers: {
        "X-API-Key": "={{$credentials.apiKey}}",
      },
    },
  }
}
```

## Use Cases
- Public APIs with simple access control
- Services that don't require OAuth or user context

## Tips
- Always mark the field as `typeOptions: { password: true }` if sensitive
- Some APIs use `Authorization: Bearer` instead of a custom header

## API Key in Query String vs Header

Here are examples showing both common API key authentication patterns:

**Header-based API Key:**
```ts
export class HeaderApiKeyAuth implements ICredentialType {
  name = 'headerApiKeyAuth';
  displayName = 'Header API Key Auth';
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
      description: 'Your API key from the service dashboard',
    },
  ];
  
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
      },
    },
  };
}
```

**Query Parameter API Key:**
```ts
export class QueryApiKeyAuth implements ICredentialType {
  name = 'queryApiKeyAuth';
  displayName = 'Query API Key Auth';
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
      description: 'Your API key from the service dashboard',
    },
  ];
  
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      qs: {
        'api_key': '={{$credentials.apiKey}}',
      },
    },
  };
}
```

**Bearer Token Style:**
```ts
export class BearerTokenAuth implements ICredentialType {
  name = 'bearerTokenAuth';
  displayName = 'Bearer Token Auth';
  documentationUrl = 'https://docs.example.com/auth';
  properties: INodeProperties[] = [
    {
      displayName: 'Access Token',
      name: 'accessToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Your access token from the service',
    },
  ];
  
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'Authorization': 'Bearer ={{$credentials.accessToken}}',
      },
    },
  };
}
```

Choose the pattern that matches your API's authentication requirements. Most modern APIs prefer header-based authentication for security reasons.
