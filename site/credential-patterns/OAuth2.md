# OAuth2 Authentication

OAuth2 is a secure and standardized way to authorize access to APIs on behalf of a user or service account.

## Credential Definition

```ts
export class OAuth2Api implements ICredentialType {
  name = "oAuth2Api"
  displayName = "OAuth2 API"
  extends = ["oAuth2"]
  properties = [
    {
      displayName: "Client ID",
      name: "clientId",
      type: "string",
      default: "",
    },
    {
      displayName: "Client Secret",
      name: "clientSecret",
      type: "string",
      typeOptions: { password: true },
      default: "",
    },
    {
      displayName: "Token URL",
      name: "tokenUrl",
      type: "string",
      default: "",
    },
    {
      displayName: "Auth URL",
      name: "authUrl",
      type: "string",
      default: "",
    },
  ]
}
```

## Use Cases
- APIs that require user consent (e.g. Google, Slack)
- Secure access with refresh tokens

## Tips
- Use `extends = ["oAuth2"]` to inherit built-in behavior
- Use scopes to limit access
- Use `authenticate()` for service account flows

## OAuth2 with Scopes and Token Refresh

Here's a complete OAuth2 credential configuration with scopes and automatic token refresh:

```ts
import {
  ICredentialType,
  INodeProperties,
  ICredentialTestRequest,
  ICredentialDataDecryptedObject,
} from 'n8n-workflow';

export class GoogleSheetsOAuth2Api implements ICredentialType {
  name = 'googleSheetsOAuth2Api';
  extends = ['googleOAuth2Api'];
  displayName = 'Google Sheets OAuth2 API';
  documentationUrl = 'https://developers.google.com/sheets/api/guides/authorizing';
  properties: INodeProperties[] = [
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'hidden',
      default: 'https://www.googleapis.com/auth/spreadsheets',
    },
  ];
  
  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://sheets.googleapis.com',
      url: '/v4/spreadsheets',
      method: 'GET',
    },
  };
}
```

**Full OAuth2 Configuration with Custom URLs:**
```ts
export class CustomOAuth2Api implements ICredentialType {
  name = 'customOAuth2Api';
  displayName = 'Custom OAuth2 API';
  documentationUrl = 'https://docs.example.com/oauth';
  properties: INodeProperties[] = [
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden',
      default: 'authorizationCode',
    },
    {
      displayName: 'Authorization URL',
      name: 'authUrl',
      type: 'string',
      default: 'https://api.example.com/oauth/authorize',
      required: true,
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'string',
      default: 'https://api.example.com/oauth/token',
      required: true,
    },
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
      displayName: 'Scope',
      name: 'scope',
      type: 'string',
      default: 'read write',
      description: 'Space-separated list of scopes',
    },
    {
      displayName: 'Auth URI Query Parameters',
      name: 'authQueryParameters',
      type: 'hidden',
      default: 'response_type=code',
    },
    {
      displayName: 'Authentication',
      name: 'authentication',
      type: 'hidden',
      default: 'header',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'oauth2',
    properties: {
      tokenType: 'Bearer',
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.example.com',
      url: '/user/profile',
      method: 'GET',
    },
  };
}
```

**Client Credentials Flow (Service Account):**
```ts
export class ServiceAccountOAuth2 implements ICredentialType {
  name = 'serviceAccountOAuth2';
  displayName = 'Service Account OAuth2';
  documentationUrl = 'https://docs.example.com/service-auth';
  properties: INodeProperties[] = [
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden',
      default: 'clientCredentials',
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'string',
      default: 'https://api.example.com/oauth/token',
      required: true,
    },
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
      displayName: 'Scope',
      name: 'scope',
      type: 'string',
      default: 'api:read api:write',
      description: 'Space-separated list of scopes for service access',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'oauth2',
    properties: {
      tokenType: 'Bearer',
      grantType: 'clientCredentials',
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.example.com',
      url: '/health',
      method: 'GET',
    },
  };
}
```

These examples show different OAuth2 flows:
- **Authorization Code**: For user consent flows (most common)
- **Client Credentials**: For service-to-service authentication
- **Custom URLs**: For APIs with non-standard OAuth endpoints

The `test` property automatically validates credentials when users save them in the n8n UI.
