# Apify Node

This node integrates with the Apify platform to run actors and retrieve datasets.

## Key Features
- Uses API token for authentication
- Can trigger actors and wait for completion
- Fetches dataset items from actor runs

## Implementation Highlights
- Uses `httpRequest` with `Authorization: Bearer` header
- Polls actor run status until finished
- Streams dataset items into workflow

## Use Cases
- Web scraping pipelines
- Data enrichment workflows
- Scheduled data collection

## Teaching Value
- Demonstrates polling pattern for async jobs
- Shows how to chain multiple API calls
- Good example of a multi-step integration

## Complete Apify Actor Runner Implementation

Here's a full Apify node that runs actors and polls for completion:

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';

export class ApifyNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Apify',
    name: 'apify',
    icon: 'file:apify.svg',
    group: ['transform'],
    version: 1,
    description: 'Run Apify actors and retrieve datasets',
    defaults: {
      name: 'Apify',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'apifyApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Run Actor',
            value: 'runActor',
            description: 'Start an actor and wait for completion',
            action: 'Run an actor',
          },
          {
            name: 'Get Dataset Items',
            value: 'getDatasetItems',
            description: 'Retrieve items from a dataset',
            action: 'Get dataset items',
          },
          {
            name: 'Get Actor Run',
            value: 'getActorRun',
            description: 'Get information about an actor run',
            action: 'Get actor run details',
          },
        ],
        default: 'runActor',
      },
      {
        displayName: 'Actor ID',
        name: 'actorId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['runActor'],
          },
        },
        description: 'ID or name of the actor to run',
        placeholder: 'apify/web-scraper',
      },
      {
        displayName: 'Actor Input',
        name: 'actorInput',
        type: 'json',
        default: '{}',
        displayOptions: {
          show: {
            operation: ['runActor'],
          },
        },
        description: 'Input configuration for the actor (JSON)',
        placeholder: '{"startUrls": [{"url": "https://example.com"}]}',
      },
      {
        displayName: 'Wait for Completion',
        name: 'waitForCompletion',
        type: 'boolean',
        default: true,
        displayOptions: {
          show: {
            operation: ['runActor'],
          },
        },
        description: 'Whether to wait for the actor run to complete',
      },
      {
        displayName: 'Timeout (minutes)',
        name: 'timeout',
        type: 'number',
        default: 10,
        displayOptions: {
          show: {
            operation: ['runActor'],
            waitForCompletion: [true],
          },
        },
        description: 'Maximum time to wait for actor completion',
      },
      {
        displayName: 'Dataset ID',
        name: 'datasetId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['getDatasetItems'],
          },
        },
        description: 'ID of the dataset to retrieve items from',
      },
      {
        displayName: 'Run ID',
        name: 'runId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['getActorRun'],
          },
        },
        description: 'ID of the actor run to retrieve',
      },
      {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Memory (MB)',
            name: 'memory',
            type: 'number',
            default: 1024,
            description: 'Amount of memory allocated for the actor run',
          },
          {
            displayName: 'Build',
            name: 'build',
            type: 'string',
            default: 'latest',
            description: 'Tag or number of the actor build to run',
          },
          {
            displayName: 'Max Items',
            name: 'maxItems',
            type: 'number',
            default: 1000,
            description: 'Maximum number of dataset items to retrieve',
          },
          {
            displayName: 'Clean Items',
            name: 'clean',
            type: 'boolean',
            default: true,
            description: 'Whether to omit empty items and unify output format',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    const credentials = await this.getCredentials('apifyApi');
    const apiToken = credentials.apiToken as string;
    const baseUrl = 'https://api.apify.com/v2';

    const headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };

    try {
      if (operation === 'runActor') {
        const actorId = this.getNodeParameter('actorId', 0) as string;
        const actorInput = this.getNodeParameter('actorInput', 0) as string;
        const waitForCompletion = this.getNodeParameter('waitForCompletion', 0) as boolean;
        const timeout = this.getNodeParameter('timeout', 0) as number;
        const additionalOptions = this.getNodeParameter('additionalOptions', 0, {}) as any;

        let parsedInput: any = {};
        try {
          parsedInput = JSON.parse(actorInput);
        } catch (error) {
          throw new NodeOperationError(
            this.getNode(),
            `Invalid JSON in Actor Input: ${error.message}`
          );
        }

        // Start the actor run
        const runPayload: any = {
          ...parsedInput,
        };

        if (additionalOptions.memory) {
          runPayload.memory = additionalOptions.memory;
        }
        if (additionalOptions.build) {
          runPayload.build = additionalOptions.build;
        }

        const runResponse = await this.helpers.request({
          method: 'POST',
          url: `${baseUrl}/acts/${actorId}/runs`,
          headers,
          body: runPayload,
          json: true,
        });

        const runId = runResponse.data.id;

        returnData.push({
          json: {
            runId,
            status: runResponse.data.status,
            startedAt: runResponse.data.startedAt,
            actorId,
            message: 'Actor run started',
          },
        });

        if (waitForCompletion) {
          // Poll for completion
          const startTime = Date.now();
          const timeoutMs = timeout * 60 * 1000;
          let completed = false;
          let finalStatus = '';

          while (!completed && (Date.now() - startTime) < timeoutMs) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            const statusResponse = await this.helpers.request({
              method: 'GET',
              url: `${baseUrl}/actor-runs/${runId}`,
              headers,
              json: true,
            });

            const status = statusResponse.data.status;
            finalStatus = status;

            if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
              completed = true;
            }
          }

          if (!completed) {
            throw new NodeOperationError(
              this.getNode(),
              `Actor run timed out after ${timeout} minutes`
            );
          }

          if (finalStatus === 'FAILED') {
            throw new NodeOperationError(
              this.getNode(),
              'Actor run failed'
            );
          }

          // Get final run details
          const finalRunResponse = await this.helpers.request({
            method: 'GET',
            url: `${baseUrl}/actor-runs/${runId}`,
            headers,
            json: true,
          });

          const runData = finalRunResponse.data;

          returnData.push({
            json: {
              runId,
              status: runData.status,
              startedAt: runData.startedAt,
              finishedAt: runData.finishedAt,
              stats: runData.stats,
              defaultDatasetId: runData.defaultDatasetId,
              defaultKeyValueStoreId: runData.defaultKeyValueStoreId,
              message: 'Actor run completed',
            },
          });

          // Automatically fetch dataset items if available
          if (runData.defaultDatasetId) {
            const datasetItems = await this.fetchDatasetItems(
              runData.defaultDatasetId,
              additionalOptions.maxItems || 1000,
              additionalOptions.clean !== false,
              headers
            );

            for (const item of datasetItems) {
              returnData.push({
                json: item,
              });
            }
          }
        }

      } else if (operation === 'getDatasetItems') {
        const datasetId = this.getNodeParameter('datasetId', 0) as string;
        const additionalOptions = this.getNodeParameter('additionalOptions', 0, {}) as any;

        const datasetItems = await this.fetchDatasetItems(
          datasetId,
          additionalOptions.maxItems || 1000,
          additionalOptions.clean !== false,
          headers
        );

        for (const item of datasetItems) {
          returnData.push({
            json: item,
          });
        }

      } else if (operation === 'getActorRun') {
        const runId = this.getNodeParameter('runId', 0) as string;

        const runResponse = await this.helpers.request({
          method: 'GET',
          url: `${baseUrl}/actor-runs/${runId}`,
          headers,
          json: true,
        });

        returnData.push({
          json: runResponse.data,
        });
      }

    } catch (error) {
      throw new NodeApiError(this.getNode(), error, {
        message: `Apify operation failed: ${error.message}`,
        description: error.description || 'Check your API token and parameters',
      });
    }

    return [returnData];
  }

  // Helper method to fetch dataset items
  private async fetchDatasetItems(
    datasetId: string,
    maxItems: number,
    clean: boolean,
    headers: any
  ): Promise<any[]> {
    const baseUrl = 'https://api.apify.com/v2';
    const items: any[] = [];
    let offset = 0;
    const limit = Math.min(1000, maxItems); // API limit is 1000 per request

    while (items.length < maxItems) {
      const queryParams = new URLSearchParams({
        offset: offset.toString(),
        limit: limit.toString(),
        clean: clean.toString(),
      });

      const response = await this.helpers.request({
        method: 'GET',
        url: `${baseUrl}/datasets/${datasetId}/items?${queryParams}`,
        headers,
        json: true,
      });

      const batchItems = response;
      
      if (!Array.isArray(batchItems) || batchItems.length === 0) {
        break;
      }

      items.push(...batchItems);
      offset += batchItems.length;

      // If we got fewer items than requested, we've reached the end
      if (batchItems.length < limit) {
        break;
      }
    }

    return items.slice(0, maxItems);
  }
}
```

**Apify API Credentials:**
```ts
import {
  ICredentialType,
  INodeProperties,
  ICredentialTestRequest,
} from 'n8n-workflow';

export class ApifyApi implements ICredentialType {
  name = 'apifyApi';
  displayName = 'Apify API';
  documentationUrl = 'https://docs.apify.com/api/v2';
  properties: INodeProperties[] = [
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Your Apify API token',
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.apify.com/v2',
      url: '/users/me',
      method: 'GET',
      headers: {
        'Authorization': '=Bearer {{$credentials.apiToken}}',
      },
    },
  };
}
```

**Advanced Apify Node with Error Handling:**
```ts
export class AdvancedApifyNode implements INodeType {
  description: INodeTypeDescription = {
    // ... base description ...
    properties: [
      // ... existing properties ...
      {
        displayName: 'Error Handling',
        name: 'errorHandling',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Retry Failed Runs',
            name: 'retryFailedRuns',
            type: 'boolean',
            default: false,
            description: 'Automatically retry failed actor runs',
          },
          {
            displayName: 'Max Retries',
            name: 'maxRetries',
            type: 'number',
            default: 3,
            description: 'Maximum number of retry attempts',
          },
          {
            displayName: 'Continue on Empty Dataset',
            name: 'continueOnEmpty',
            type: 'boolean',
            default: true,
            description: 'Continue execution even if dataset is empty',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Enhanced error handling and retry logic
    const errorHandling = this.getNodeParameter('errorHandling', 0, {}) as any;
    const retryFailedRuns = errorHandling.retryFailedRuns ?? false;
    const maxRetries = errorHandling.maxRetries ?? 3;

    if (operation === 'runActor' && retryFailedRuns) {
      let retryCount = 0;
      let success = false;

      while (!success && retryCount <= maxRetries) {
        try {
          // ... existing actor run logic ...
          success = true;
        } catch (error) {
          retryCount++;
          
          if (retryCount > maxRetries) {
            throw error;
          }

          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));

          returnData.push({
            json: {
              retryAttempt: retryCount,
              error: error.message,
              nextRetryIn: `${delay}ms`,
            },
          });
        }
      }
    }

    return [returnData];
  }
}
```

**Usage Examples:**

1. **Web Scraping:**
   ```json
   {
     "startUrls": [
       {"url": "https://example.com/products"}
     ],
     "maxRequestsPerCrawl": 100,
     "proxyConfiguration": {
       "useApifyProxy": true
     }
   }
   ```

2. **Data Enrichment:**
   ```json
   {
     "urls": ["https://company1.com", "https://company2.com"],
     "extractEmails": true,
     "extractPhones": true
   }
   ```

3. **Scheduled Monitoring:**
   - Run actor every hour to check for changes
   - Compare results with previous runs
   - Send alerts on significant changes

This Apify node demonstrates:
- **Async job management** with polling patterns
- **Multi-step API workflows** (start → poll → fetch results)
- **Robust error handling** with retries and timeouts
- **Dataset streaming** for large result sets
- **Flexible input handling** with JSON configuration
- **Credential testing** for API validation

Perfect for building web scraping pipelines, data collection workflows, and automated monitoring systems!
