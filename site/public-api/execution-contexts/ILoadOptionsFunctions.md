# ILoadOptionsFunctions

The execution context for loading dynamic options in node parameters. This interface is used when you need to populate dropdown lists, multi-select options, or other dynamic UI elements based on external data sources or user configuration.

## When to Use

Use `ILoadOptionsFunctions` when:
- Populating dropdown options from API responses
- Loading dynamic lists based on user credentials
- Fetching available resources from external services
- Creating dependent dropdowns where one selection affects another

## Interface Definition

```ts
interface ILoadOptionsFunctions {
  getCredentials(type: string): Promise<ICredentialDataDecryptedObject>;
  getCurrentNodeParameter(parameterName: string): NodeParameterValueType | object | undefined;
  getCurrentNodeParameters(): INodeParameters | undefined;
  getNode(): INode;
  getNodeParameter(parameterName: string, fallbackValue?: any): NodeParameterValueType | object;
  getTimezone(): string;
  getRestApiUrl(): string;
  helpers: {
    httpRequest(requestOptions: IHttpRequestOptions): Promise<any>;
    httpRequestWithAuthentication(
      credentialsType: string,
      requestOptions: IHttpRequestOptions
    ): Promise<any>;
  };
}
```

## Core Methods

### getCurrentNodeParameter()

Gets the current value of a parameter while the user is configuring the node.

```ts
getCurrentNodeParameter(parameterName: string): NodeParameterValueType | object | undefined
```

**Parameters:**
- `parameterName` - Name of the parameter to retrieve

**Returns:** Current parameter value or `undefined` if not set

### getCredentials()

Retrieves decrypted credentials for authentication.

```ts
getCredentials(type: string): Promise<ICredentialDataDecryptedObject>
```

**Parameters:**
- `type` - The credential type name

**Returns:** Promise resolving to decrypted credential data

## Implementation Example

```ts
import {
  ILoadOptionsFunctions,
  INodeListSearchItems,
  INodePropertyOptions,
} from 'n8n-workflow';

export class DynamicOptionsNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Dynamic Options',
    name: 'dynamicOptions',
    group: ['transform'],
    version: 1,
    description: 'Node with dynamic options',
    defaults: {
      name: 'Dynamic Options',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'apiCredentials',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Project',
        name: 'project',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getProjects',
        },
        default: '',
        description: 'Select a project',
      },
      {
        displayName: 'Task',
        name: 'task',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getTasks',
          loadOptionsDependsOn: ['project'],
        },
        default: '',
        description: 'Select a task',
      },
      {
        displayName: 'User',
        name: 'user',
        type: 'resourceLocator',
        default: { mode: 'list', value: '' },
        modes: [
          {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: {
              searchListMethod: 'searchUsers',
              searchable: true,
            },
          },
          {
            displayName: 'By ID',
            name: 'id',
            type: 'string',
            validation: [
              {
                type: 'regex',
                properties: {
                  regex: '^[0-9]+$',
                  errorMessage: 'User ID must be a number',
                },
              },
            ],
          },
        ],
      },
    ],
  };

  methods = {
    loadOptions: {
      async getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        try {
          const credentials = await this.getCredentials('apiCredentials');
          
          const response = await this.helpers.httpRequestWithAuthentication(
            'apiCredentials',
            {
              method: 'GET',
              url: 'https://api.example.com/projects',
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          return response.projects.map((project: any) => ({
            name: project.name,
            value: project.id,
            description: project.description,
          }));
        } catch (error) {
          throw new Error(`Failed to load projects: ${error.message}`);
        }
      },

      async getTasks(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const projectId = this.getCurrentNodeParameter('project');
        
        if (!projectId) {
          return [];
        }

        try {
          const response = await this.helpers.httpRequestWithAuthentication(
            'apiCredentials',
            {
              method: 'GET',
              url: `https://api.example.com/projects/${projectId}/tasks`,
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          return response.tasks.map((task: any) => ({
            name: task.title,
            value: task.id,
            description: `Status: ${task.status}`,
          }));
        } catch (error) {
          throw new Error(`Failed to load tasks: ${error.message}`);
        }
      },
    },

    listSearch: {
      async searchUsers(
        this: ILoadOptionsFunctions,
        filter?: string
      ): Promise<INodeListSearchItems> {
        try {
          const qs: any = {};
          if (filter) {
            qs.search = filter;
          }

          const response = await this.helpers.httpRequestWithAuthentication(
            'apiCredentials',
            {
              method: 'GET',
              url: 'https://api.example.com/users',
              qs,
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          return {
            results: response.users.map((user: any) => ({
              name: `${user.firstName} ${user.lastName}`,
              value: user.id,
              url: user.profileUrl,
            })),
          };
        } catch (error) {
          throw new Error(`Failed to search users: ${error.message}`);
        }
      },
    },
  };
}
```

## Common Patterns

### Dependent Dropdowns

```ts
// First dropdown - independent
async getCategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const response = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://api.example.com/categories',
  });

  return response.map((category: any) => ({
    name: category.name,
    value: category.id,
  }));
}

// Second dropdown - depends on first
async getSubcategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const categoryId = this.getCurrentNodeParameter('category');
  
  if (!categoryId) {
    return [];
  }

  const response = await this.helpers.httpRequest({
    method: 'GET',
    url: `https://api.example.com/categories/${categoryId}/subcategories`,
  });

  return response.map((subcategory: any) => ({
    name: subcategory.name,
    value: subcategory.id,
  }));
}
```

### Credential-Based Options

```ts
async getDatabases(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  try {
    const credentials = await this.getCredentials('databaseCredentials');
    
    // Validate credentials are present
    if (!credentials.host || !credentials.username) {
      throw new Error('Database credentials are incomplete');
    }

    const response = await this.helpers.httpRequestWithAuthentication(
      'databaseCredentials',
      {
        method: 'GET',
        url: `https://${credentials.host}/api/databases`,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    return response.databases.map((db: any) => ({
      name: db.displayName || db.name,
      value: db.name,
      description: `Type: ${db.type}, Size: ${db.size}`,
    }));
  } catch (error) {
    // Return empty array instead of throwing to prevent UI errors
    console.error('Failed to load databases:', error.message);
    return [];
  }
}
```

### Searchable Resource Lists

```ts
async searchRepositories(
  this: ILoadOptionsFunctions,
  filter?: string
): Promise<INodeListSearchItems> {
  const credentials = await this.getCredentials('githubCredentials');
  
  const qs: any = {
    per_page: 50,
    sort: 'updated',
    order: 'desc',
  };
  
  if (filter) {
    qs.q = `${filter} user:${credentials.username}`;
  } else {
    qs.q = `user:${credentials.username}`;
  }

  try {
    const response = await this.helpers.httpRequestWithAuthentication(
      'githubCredentials',
      {
        method: 'GET',
        url: 'https://api.github.com/search/repositories',
        qs,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'n8n',
        },
      }
    );

    return {
      results: response.items.map((repo: any) => ({
        name: repo.full_name,
        value: repo.name,
        url: repo.html_url,
      })),
    };
  } catch (error) {
    throw new Error(`Failed to search repositories: ${error.message}`);
  }
}
```

### Cached Options Loading

```ts
// Cache for expensive API calls
const optionsCache = new Map<string, { data: INodePropertyOptions[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async getRegions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const cacheKey = 'regions';
  const cached = optionsCache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await this.helpers.httpRequestWithAuthentication(
      'awsCredentials',
      {
        method: 'GET',
        url: 'https://api.aws.amazon.com/regions',
      }
    );

    const options = response.regions.map((region: any) => ({
      name: `${region.name} (${region.code})`,
      value: region.code,
    }));

    // Cache the results
    optionsCache.set(cacheKey, {
      data: options,
      timestamp: Date.now(),
    });

    return options;
  } catch (error) {
    // Return cached data if available, even if expired
    if (cached) {
      return cached.data;
    }
    throw new Error(`Failed to load regions: ${error.message}`);
  }
}
```

## Error Handling

### Graceful Degradation

```ts
async getOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  try {
    // Try to load from primary source
    return await this.loadFromPrimarySource();
  } catch (primaryError) {
    try {
      // Fallback to secondary source
      return await this.loadFromSecondarySource();
    } catch (secondaryError) {
      // Return static fallback options
      return [
        { name: 'Default Option 1', value: 'default1' },
        { name: 'Default Option 2', value: 'default2' },
      ];
    }
  }
}
```

### User-Friendly Error Messages

```ts
async getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  try {
    const credentials = await this.getCredentials('apiCredentials');
    
    if (!credentials.apiKey) {
      throw new Error('API key is required. Please configure your credentials.');
    }

    const response = await this.helpers.httpRequestWithAuthentication(
      'apiCredentials',
      {
        method: 'GET',
        url: 'https://api.example.com/projects',
        timeout: 10000, // 10 second timeout
      }
    );

    if (!response.projects || !Array.isArray(response.projects)) {
      throw new Error('Invalid response format from API');
    }

    return response.projects.map((project: any) => ({
      name: project.name || 'Unnamed Project',
      value: project.id,
    }));
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new Error('Unable to connect to API. Please check your network connection.');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your API credentials.');
    }
    if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your API permissions.');
    }
    throw new Error(`Failed to load projects: ${error.message}`);
  }
}
```

## Performance Optimization

### Debounced Search

```ts
// Implement debouncing for search operations
let searchTimeout: NodeJS.Timeout;

async searchItems(
  this: ILoadOptionsFunctions,
  filter?: string
): Promise<INodeListSearchItems> {
  return new Promise((resolve, reject) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce search requests
    searchTimeout = setTimeout(async () => {
      try {
        const response = await this.helpers.httpRequest({
          method: 'GET',
          url: 'https://api.example.com/search',
          qs: { q: filter, limit: 50 },
        });

        resolve({
          results: response.items.map((item: any) => ({
            name: item.name,
            value: item.id,
          })),
        });
      } catch (error) {
        reject(error);
      }
    }, 300); // 300ms debounce
  });
}
```

### Pagination Support

```ts
async searchLargeDataset(
  this: ILoadOptionsFunctions,
  filter?: string,
  paginationToken?: string
): Promise<INodeListSearchItems> {
  const qs: any = {
    limit: 100,
    search: filter || '',
  };

  if (paginationToken) {
    qs.cursor = paginationToken;
  }

  const response = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://api.example.com/items',
    qs,
  });

  return {
    results: response.items.map((item: any) => ({
      name: item.name,
      value: item.id,
    })),
    paginationToken: response.nextCursor,
  };
}
```

## Best Practices

### 1. Always Handle Missing Dependencies

```ts
async getDependentOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const parentValue = this.getCurrentNodeParameter('parentField');
  
  // Return empty array if dependency is not set
  if (!parentValue) {
    return [];
  }
  
  // Proceed with loading dependent options
  return await this.loadDependentOptions(parentValue);
}
```

### 2. Provide Meaningful Option Names

```ts
// ✅ Good - descriptive names
return response.users.map((user: any) => ({
  name: `${user.firstName} ${user.lastName} (${user.email})`,
  value: user.id,
  description: `Role: ${user.role}, Department: ${user.department}`,
}));

// ❌ Bad - unclear names
return response.users.map((user: any) => ({
  name: user.id,
  value: user.id,
}));
```

### 3. Use Type Safety

```ts
interface ApiProject {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

async getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const response = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://api.example.com/projects',
  });

  const projects = response.projects as ApiProject[];
  
  return projects
    .filter(project => project.status === 'active')
    .map(project => ({
      name: project.name,
      value: project.id,
      description: project.description,
    }));
}
```

## See Also

- **[IExecuteFunctions](./IExecuteFunctions)** - Main execution context
- **[getCurrentNodeParameter](../parameters/getCurrentNodeParameter)** - Getting current parameter values
- **[HTTP Helpers](../helpers/http)** - Making HTTP requests
- **[Dynamic Options](../../ui-ux/DynamicOptions)** - UI patterns for dynamic options
