# Display Options

Display options control when a property is shown in the UI based on other parameter values.

## Syntax

```ts
displayOptions: {
  show: {
    operation: ['create'],
  },
  hide: {
    resource: ['user'],
  },
}
```

## Use Cases
- Show advanced fields only when needed
- Hide irrelevant options based on context
- Create dynamic, user-friendly forms

## Tips
- Use `show` and `hide` together for fine control
- Combine multiple conditions with AND logic
- Use `displayOptions: { show: { resource: ['*'] } }` to show for all

## Complete Display Options Examples

Here are comprehensive examples showing how to use `displayOptions` to create dynamic, user-friendly forms:

### Basic Show/Hide Logic

```ts
export class DisplayOptionsExample implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Display Options Example',
    name: 'displayOptionsExample',
    group: ['transform'],
    version: 1,
    description: 'Demonstrates advanced display options patterns',
    defaults: {
      name: 'Display Options Example',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'User',
            value: 'user',
          },
          {
            name: 'Company',
            value: 'company',
          },
          {
            name: 'Contact',
            value: 'contact',
          },
        ],
        default: 'user',
        description: 'The resource to work with',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['user'],
          },
        },
        options: [
          {
            name: 'Create',
            value: 'create',
            action: 'Create a user',
          },
          {
            name: 'Update',
            value: 'update',
            action: 'Update a user',
          },
          {
            name: 'Delete',
            value: 'delete',
            action: 'Delete a user',
          },
          {
            name: 'Get',
            value: 'get',
            action: 'Get a user',
          },
        ],
        default: 'create',
        description: 'The operation to perform on users',
      },
      {
        displayName: 'Company Operation',
        name: 'companyOperation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['company'],
          },
        },
        options: [
          {
            name: 'Create Company',
            value: 'create',
            action: 'Create a company',
          },
          {
            name: 'List Companies',
            value: 'list',
            action: 'List all companies',
          },
        ],
        default: 'create',
        description: 'The operation to perform on companies',
      },
      // User-specific fields
      {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['user'],
            operation: ['update', 'delete', 'get'],
          },
        },
        default: '',
        description: 'ID of the user to operate on',
      },
      {
        displayName: 'User Name',
        name: 'userName',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['user'],
            operation: ['create', 'update'],
          },
        },
        default: '',
        description: 'Name of the user',
      },
      {
        displayName: 'User Email',
        name: 'userEmail',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['user'],
            operation: ['create', 'update'],
          },
        },
        default: '',
        description: 'Email address of the user',
      },
      // Company-specific fields
      {
        displayName: 'Company Name',
        name: 'companyName',
        type: 'string',
        required: true,
        displayOptions: {
          show: {
            resource: ['company'],
            companyOperation: ['create'],
          },
        },
        default: '',
        description: 'Name of the company',
      },
      {
        displayName: 'Industry',
        name: 'industry',
        type: 'options',
        displayOptions: {
          show: {
            resource: ['company'],
            companyOperation: ['create'],
          },
        },
        options: [
          { name: 'Technology', value: 'tech' },
          { name: 'Healthcare', value: 'healthcare' },
          { name: 'Finance', value: 'finance' },
          { name: 'Other', value: 'other' },
        ],
        default: 'tech',
        description: 'Industry of the company',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      
      if (resource === 'user') {
        const operation = this.getNodeParameter('operation', i) as string;
        const result: any = { resource, operation };

        if (operation === 'create' || operation === 'update') {
          result.userName = this.getNodeParameter('userName', i);
          result.userEmail = this.getNodeParameter('userEmail', i);
        }
        
        if (operation === 'update' || operation === 'delete' || operation === 'get') {
          result.userId = this.getNodeParameter('userId', i);
        }

        returnData.push({ json: result });
        
      } else if (resource === 'company') {
        const companyOperation = this.getNodeParameter('companyOperation', i) as string;
        const result: any = { resource, operation: companyOperation };

        if (companyOperation === 'create') {
          result.companyName = this.getNodeParameter('companyName', i);
          result.industry = this.getNodeParameter('industry', i);
        }

        returnData.push({ json: result });
      }
    }

    return [returnData];
  }
}
```

### Advanced Display Options with Hide Logic

```ts
export class AdvancedDisplayOptions implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Advanced Display Options',
    name: 'advancedDisplayOptions',
    group: ['transform'],
    version: 1,
    description: 'Advanced display options with show and hide logic',
    defaults: {
      name: 'Advanced Display Options',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Authentication Method',
        name: 'authMethod',
        type: 'options',
        options: [
          { name: 'API Key', value: 'apiKey' },
          { name: 'OAuth2', value: 'oauth2' },
          { name: 'Basic Auth', value: 'basic' },
          { name: 'No Auth', value: 'none' },
        ],
        default: 'apiKey',
        description: 'Method to use for authentication',
      },
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: {
          password: true,
        },
        displayOptions: {
          show: {
            authMethod: ['apiKey'],
          },
        },
        default: '',
        description: 'Your API key',
      },
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        displayOptions: {
          show: {
            authMethod: ['basic'],
          },
        },
        default: '',
        description: 'Username for basic authentication',
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: {
          password: true,
        },
        displayOptions: {
          show: {
            authMethod: ['basic'],
          },
        },
        default: '',
        description: 'Password for basic authentication',
      },
      {
        displayName: 'OAuth2 Settings',
        name: 'oauth2Settings',
        type: 'collection',
        placeholder: 'Add OAuth2 Setting',
        displayOptions: {
          show: {
            authMethod: ['oauth2'],
          },
        },
        default: {},
        options: [
          {
            displayName: 'Client ID',
            name: 'clientId',
            type: 'string',
            default: '',
            description: 'OAuth2 client ID',
          },
          {
            displayName: 'Client Secret',
            name: 'clientSecret',
            type: 'string',
            typeOptions: {
              password: true,
            },
            default: '',
            description: 'OAuth2 client secret',
          },
          {
            displayName: 'Scope',
            name: 'scope',
            type: 'string',
            default: 'read write',
            description: 'OAuth2 scope',
          },
        ],
      },
      {
        displayName: 'Request Method',
        name: 'method',
        type: 'options',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
        ],
        default: 'GET',
        description: 'HTTP method to use',
      },
      {
        displayName: 'Request Body',
        name: 'body',
        type: 'json',
        displayOptions: {
          show: {
            method: ['POST', 'PUT'],
          },
          hide: {
            authMethod: ['none'],
          },
        },
        default: '{}',
        description: 'Request body (JSON)',
      },
      {
        displayName: 'Advanced Options',
        name: 'advancedOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
          hide: {
            authMethod: ['none'],
          },
        },
        options: [
          {
            displayName: 'Timeout (ms)',
            name: 'timeout',
            type: 'number',
            default: 5000,
            description: 'Request timeout in milliseconds',
          },
          {
            displayName: 'Retry Count',
            name: 'retryCount',
            type: 'number',
            default: 3,
            description: 'Number of retry attempts',
          },
        ],
      },
      {
        displayName: 'Debug Mode',
        name: 'debugMode',
        type: 'boolean',
        default: false,
        description: 'Enable debug logging',
        displayOptions: {
          show: {
            authMethod: ['apiKey', 'oauth2', 'basic'],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const authMethod = this.getNodeParameter('authMethod', i) as string;
      const method = this.getNodeParameter('method', i) as string;
      const debugMode = this.getNodeParameter('debugMode', i, false) as boolean;

      const result: any = {
        authMethod,
        method,
        debugMode,
      };

      // Add auth-specific data
      if (authMethod === 'apiKey') {
        result.apiKey = this.getNodeParameter('apiKey', i);
      } else if (authMethod === 'basic') {
        result.username = this.getNodeParameter('username', i);
        result.password = this.getNodeParameter('password', i);
      } else if (authMethod === 'oauth2') {
        result.oauth2Settings = this.getNodeParameter('oauth2Settings', i, {});
      }

      // Add body for POST/PUT requests
      if (method === 'POST' || method === 'PUT') {
        const bodyParam = this.getNodeParameter('body', i, '{}') as string;
        try {
          result.body = JSON.parse(bodyParam);
        } catch (error) {
          result.body = bodyParam;
        }
      }

      // Add advanced options if auth is not 'none'
      if (authMethod !== 'none') {
        result.advancedOptions = this.getNodeParameter('advancedOptions', i, {});
      }

      returnData.push({ json: result });
    }

    return [returnData];
  }
}
```

**Key Display Options Patterns:**

1. **Basic Show Logic:**
   ```ts
   displayOptions: {
     show: {
       operation: ['create', 'update'],
     },
   }
   ```

2. **Multiple Conditions (AND logic):**
   ```ts
   displayOptions: {
     show: {
       resource: ['user'],
       operation: ['create'],
     },
   }
   ```

3. **Hide Logic:**
   ```ts
   displayOptions: {
     hide: {
       authMethod: ['none'],
     },
   }
   ```

4. **Combined Show and Hide:**
   ```ts
   displayOptions: {
     show: {
       method: ['POST', 'PUT'],
     },
     hide: {
       authMethod: ['none'],
     },
   }
   ```

5. **Wildcard Matching:**
   ```ts
   displayOptions: {
     show: {
       resource: ['*'], // Show for all resource values
     },
   }
   ```

These examples demonstrate how to create sophisticated, user-friendly forms that adapt based on user selections, reducing clutter and improving the overall user experience!
