# Service Account Authentication

Service accounts are used for server-to-server authentication, often with JWT or OAuth2 flows.

## Credential Definition

```ts
export class GoogleServiceAccount implements ICredentialType {
  name = "googleServiceAccount"
  displayName = "Google Service Account"
  properties = [
    {
      displayName: "Email",
      name: "email",
      type: "string",
      default: "",
    },
    {
      displayName: "Private Key",
      name: "privateKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
    },
  ]

  async authenticate(credentials, requestOptions) {
    const jwt = signJwt(credentials.email, credentials.privateKey)
    const token = await exchangeJwtForToken(jwt)
    requestOptions.headers = {
      ...requestOptions.headers,
      Authorization: `Bearer ${token}`,
    }
    return requestOptions
  }
}
```

## Use Cases
- Google Cloud APIs
- Internal APIs with JWT-based auth

## Tips
- Normalize newlines in private key (`.replace(/\\n/g, '\n')`)
- Use `authenticate()` to inject token dynamically

## Service Account with JWT

Here's a complete service account credential that generates JWTs for authentication:

```ts
import {
  ICredentialType,
  INodeProperties,
  ICredentialTestRequest,
  ICredentialDataDecryptedObject,
  IHttpRequestOptions,
} from 'n8n-workflow';
import { sign } from 'jsonwebtoken';

export class JwtServiceAccount implements ICredentialType {
  name = 'jwtServiceAccount';
  displayName = 'JWT Service Account';
  documentationUrl = 'https://docs.example.com/service-account';
  properties: INodeProperties[] = [
    {
      displayName: 'Service Account Email',
      name: 'email',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'service-account@project.iam.gserviceaccount.com',
      description: 'The email address of the service account',
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
        rows: 5,
      },
      default: '',
      required: true,
      placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
      description: 'The private key for the service account (PEM format)',
    },
    {
      displayName: 'Token URL',
      name: 'tokenUrl',
      type: 'string',
      default: 'https://oauth2.googleapis.com/token',
      required: true,
      description: 'The URL to exchange JWT for access token',
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'string',
      default: 'https://www.googleapis.com/auth/cloud-platform',
      description: 'Space-separated list of scopes',
    },
  ];

  async authenticate(
    credentials: ICredentialDataDecryptedObject,
    requestOptions: IHttpRequestOptions,
  ): Promise<IHttpRequestOptions> {
    const { email, privateKey, tokenUrl, scope } = credentials;

    // Normalize private key (handle escaped newlines)
    const normalizedPrivateKey = (privateKey as string).replace(/\\n/g, '\n');

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: email as string,
      sub: email as string,
      aud: tokenUrl as string,
      iat: now,
      exp: now + 3600, // 1 hour
      scope: scope as string,
    };

    try {
      // Sign JWT
      const jwt = sign(payload, normalizedPrivateKey, {
        algorithm: 'RS256',
        keyid: 'key-id', // Optional: add key ID if required
      });

      // Exchange JWT for access token
      const tokenResponse = await this.helpers.request({
        method: 'POST',
        url: tokenUrl as string,
        form: {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        },
        json: true,
      });

      // Add access token to request headers
      requestOptions.headers = {
        ...requestOptions.headers,
        Authorization: `Bearer ${tokenResponse.access_token}`,
      };

      return requestOptions;
    } catch (error) {
      throw new Error(`JWT authentication failed: ${error.message}`);
    }
  }

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://www.googleapis.com',
      url: '/oauth2/v1/tokeninfo',
      method: 'GET',
    },
  };
}
```

**Google Service Account (Simplified):**
```ts
export class GoogleServiceAccountSimple implements ICredentialType {
  name = 'googleServiceAccountSimple';
  displayName = 'Google Service Account (JSON)';
  documentationUrl = 'https://cloud.google.com/iam/docs/service-accounts';
  properties: INodeProperties[] = [
    {
      displayName: 'Service Account JSON',
      name: 'serviceAccountJson',
      type: 'json',
      typeOptions: {
        rows: 10,
      },
      default: '',
      required: true,
      description: 'The entire JSON key file downloaded from Google Cloud Console',
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'options',
      options: [
        {
          name: 'Cloud Platform (Full Access)',
          value: 'https://www.googleapis.com/auth/cloud-platform',
        },
        {
          name: 'Sheets (Read/Write)',
          value: 'https://www.googleapis.com/auth/spreadsheets',
        },
        {
          name: 'Drive (Read/Write)',
          value: 'https://www.googleapis.com/auth/drive',
        },
      ],
      default: 'https://www.googleapis.com/auth/cloud-platform',
      description: 'The scope of access for the service account',
    },
  ];

  async authenticate(
    credentials: ICredentialDataDecryptedObject,
    requestOptions: IHttpRequestOptions,
  ): Promise<IHttpRequestOptions> {
    const serviceAccountJson = JSON.parse(credentials.serviceAccountJson as string);
    const scope = credentials.scope as string;

    const { client_email, private_key, token_uri } = serviceAccountJson;

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: client_email,
      sub: client_email,
      aud: token_uri,
      iat: now,
      exp: now + 3600,
      scope,
    };

    try {
      // Sign JWT
      const jwt = sign(payload, private_key, { algorithm: 'RS256' });

      // Exchange JWT for access token
      const tokenResponse = await this.helpers.request({
        method: 'POST',
        url: token_uri,
        form: {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        },
        json: true,
      });

      // Add access token to request headers
      requestOptions.headers = {
        ...requestOptions.headers,
        Authorization: `Bearer ${tokenResponse.access_token}`,
      };

      return requestOptions;
    } catch (error) {
      throw new Error(`Google Service Account authentication failed: ${error.message}`);
    }
  }

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://www.googleapis.com',
      url: '/oauth2/v1/tokeninfo',
      method: 'GET',
    },
  };
}
```

**AWS Service Account (IAM Role):**
```ts
export class AwsServiceAccount implements ICredentialType {
  name = 'awsServiceAccount';
  displayName = 'AWS Service Account';
  documentationUrl = 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html';
  properties: INodeProperties[] = [
    {
      displayName: 'Access Key ID',
      name: 'accessKeyId',
      type: 'string',
      default: '',
      required: true,
      description: 'AWS Access Key ID',
    },
    {
      displayName: 'Secret Access Key',
      name: 'secretAccessKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'AWS Secret Access Key',
    },
    {
      displayName: 'Region',
      name: 'region',
      type: 'string',
      default: 'us-east-1',
      required: true,
      description: 'AWS Region',
    },
    {
      displayName: 'Session Token',
      name: 'sessionToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'AWS Session Token (for temporary credentials)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'Authorization': '={{$credentials.accessKeyId}}:{{$credentials.secretAccessKey}}',
        'X-Amz-Security-Token': '={{$credentials.sessionToken}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://sts.amazonaws.com',
      url: '/?Action=GetCallerIdentity&Version=2011-06-15',
      method: 'GET',
    },
  };
}
```

These examples show different service account patterns:
- **JWT-based**: Generate and sign JWTs for token exchange
- **JSON Key File**: Use Google's service account JSON format
- **AWS IAM**: Use access keys for AWS service authentication

The `authenticate` method dynamically generates tokens, while the `test` property validates the credentials.
