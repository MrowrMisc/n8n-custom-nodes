# Power BI Node

This node integrates with Microsoft Power BI to push data into datasets using the REST API.

## Key Features
- Uses OAuth2 for authentication
- Supports streaming rows into a dataset
- Can create or update datasets dynamically

## Implementation Highlights
- Uses `oAuth2Api` credential with Microsoft endpoints
- Constructs dataset schema from input data
- Sends rows using `POST /datasets/{id}/tables/{name}/rows`

## Use Cases
- Real-time dashboards
- Business intelligence pipelines
- Automated reporting

## Teaching Value
- Demonstrates OAuth2 integration with Microsoft
- Shows how to map JSON to tabular schema
- Good example of a data sink node

## Complete Power BI Integration Implementation

Here's a full Power BI node that pushes data to datasets using OAuth2 authentication:

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';

export class PowerBINode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Power BI',
    name: 'powerBI',
    icon: 'file:powerbi.svg',
    group: ['output'],
    version: 1,
    description: 'Push data to Microsoft Power BI datasets',
    defaults: {
      name: 'Power BI',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'powerBIApi',
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
            name: 'Push Rows',
            value: 'pushRows',
            description: 'Add rows to an existing dataset table',
            action: 'Push rows to a dataset table',
          },
          {
            name: 'Create Dataset',
            value: 'createDataset',
            description: 'Create a new dataset with schema',
            action: 'Create a new dataset',
          },
          {
            name: 'Get Datasets',
            value: 'getDatasets',
            description: 'List all datasets in workspace',
            action: 'Get all datasets',
          },
        ],
        default: 'pushRows',
      },
      {
        displayName: 'Workspace ID',
        name: 'workspaceId',
        type: 'string',
        default: '',
        required: true,
        description: 'Power BI workspace (group) ID',
        placeholder: 'f089354e-8366-4e18-aea3-4cb4a3a50b48',
      },
      {
        displayName: 'Dataset ID',
        name: 'datasetId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['pushRows'],
          },
        },
        description: 'ID of the dataset to push data to',
        placeholder: 'cfafbeb1-8037-4d0c-896e-a46fb27ff229',
      },
      {
        displayName: 'Table Name',
        name: 'tableName',
        type: 'string',
        default: 'Table1',
        required: true,
        displayOptions: {
          show: {
            operation: ['pushRows'],
          },
        },
        description: 'Name of the table within the dataset',
      },
      {
        displayName: 'Dataset Name',
        name: 'datasetName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['createDataset'],
          },
        },
        description: 'Name for the new dataset',
        placeholder: 'My Dataset',
      },
      {
        displayName: 'Default Mode',
        name: 'defaultMode',
        type: 'options',
        options: [
          {
            name: 'Push',
            value: 'Push',
            description: 'Data is pushed to Power BI in real-time',
          },
          {
            name: 'Streaming',
            value: 'Streaming',
            description: 'Data is streamed to Power BI',
          },
          {
            name: 'Push Streaming',
            value: 'PushStreaming',
            description: 'Combination of Push and Streaming',
          },
        ],
        default: 'Push',
        displayOptions: {
          show: {
            operation: ['createDataset'],
          },
        },
        description: 'Default mode for the dataset',
      },
      {
        displayName: 'Auto-Create Schema',
        name: 'autoCreateSchema',
        type: 'boolean',
        default: true,
        displayOptions: {
          show: {
            operation: ['createDataset'],
          },
        },
        description: 'Whether to automatically create schema from input data',
      },
      {
        displayName: 'Batch Size',
        name: 'batchSize',
        type: 'number',
        default: 1000,
        displayOptions: {
          show: {
            operation: ['pushRows'],
          },
        },
        description: 'Number of rows to send in each batch (max 10,000)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;
    const workspaceId = this.getNodeParameter('workspaceId', 0) as string;

    const credentials = await this.getCredentials('powerBIApi');
    const baseUrl = 'https://api.powerbi.com/v1.0/myorg';

    try {
      if (operation === 'getDatasets') {
        // Get all datasets in workspace
        const response = await this.helpers.requestWithAuthentication.call(
          this,
          'powerBIApi',
          {
            method: 'GET',
            url: `${baseUrl}/groups/${workspaceId}/datasets`,
            json: true,
          }
        );

        for (const dataset of response.value || []) {
          returnData.push({
            json: {
              id: dataset.id,
              name: dataset.name,
              configuredBy: dataset.configuredBy,
              defaultMode: dataset.defaultMode,
              isRefreshable: dataset.isRefreshable,
              isOnPremGatewayRequired: dataset.isOnPremGatewayRequired,
            },
          });
        }

      } else if (operation === 'createDataset') {
        const datasetName = this.getNodeParameter('datasetName', 0) as string;
        const defaultMode = this.getNodeParameter('defaultMode', 0) as string;
        const autoCreateSchema = this.getNodeParameter('autoCreateSchema', 0) as boolean;

        let tables: any[] = [];

        if (autoCreateSchema && items.length > 0) {
          // Auto-generate schema from first item
          const sampleData = items[0].json;
          const columns = Object.keys(sampleData).map(key => {
            const value = sampleData[key];
            let dataType = 'String';

            if (typeof value === 'number') {
              dataType = Number.isInteger(value) ? 'Int64' : 'Double';
            } else if (typeof value === 'boolean') {
              dataType = 'Boolean';
            } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
              dataType = 'DateTime';
            }

            return {
              name: key,
              dataType,
            };
          });

          tables = [{
            name: 'Table1',
            columns,
          }];
        }

        const datasetPayload = {
          name: datasetName,
          defaultMode,
          tables,
        };

        const response = await this.helpers.requestWithAuthentication.call(
          this,
          'powerBIApi',
          {
            method: 'POST',
            url: `${baseUrl}/groups/${workspaceId}/datasets`,
            body: datasetPayload,
            json: true,
          }
        );

        returnData.push({
          json: {
            id: response.id,
            name: response.name,
            defaultMode: response.defaultMode,
            tables: response.tables,
            message: 'Dataset created successfully',
          },
        });

      } else if (operation === 'pushRows') {
        const datasetId = this.getNodeParameter('datasetId', 0) as string;
        const tableName = this.getNodeParameter('tableName', 0) as string;
        const batchSize = this.getNodeParameter('batchSize', 0) as number;

        // Validate batch size
        if (batchSize > 10000) {
          throw new NodeOperationError(
            this.getNode(),
            'Batch size cannot exceed 10,000 rows'
          );
        }

        // Process items in batches
        const batches: any[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
          batches.push(items.slice(i, i + batchSize));
        }

        let totalRowsPushed = 0;

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          const rows = batch.map(item => item.json);

          try {
            await this.helpers.requestWithAuthentication.call(
              this,
              'powerBIApi',
              {
                method: 'POST',
                url: `${baseUrl}/groups/${workspaceId}/datasets/${datasetId}/tables/${tableName}/rows`,
                body: {
                  rows,
                },
                json: true,
              }
            );

            totalRowsPushed += rows.length;

            // Add batch result to return data
            returnData.push({
              json: {
                batchIndex: batchIndex + 1,
                rowsInBatch: rows.length,
                totalRowsPushed,
                status: 'success',
              },
            });

          } catch (error) {
            if (this.continueOnFail()) {
              returnData.push({
                json: {
                  batchIndex: batchIndex + 1,
                  rowsInBatch: rows.length,
                  error: error.message,
                  status: 'failed',
                },
              });
              continue;
            }
            throw error;
          }
        }

        // Add summary
        returnData.push({
          json: {
            operation: 'pushRows',
            datasetId,
            tableName,
            totalBatches: batches.length,
            totalRowsPushed,
            summary: `Successfully pushed ${totalRowsPushed} rows in ${batches.length} batches`,
          },
        });
      }

    } catch (error) {
      throw new NodeApiError(this.getNode(), error, {
        message: `Power BI operation failed: ${error.message}`,
        description: error.description || 'Check your credentials and parameters',
      });
    }

    return [returnData];
  }
}
```

**Power BI OAuth2 Credentials:**
```ts
import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class PowerBIApi implements ICredentialType {
  name = 'powerBIApi';
  extends = ['oAuth2Api'];
  displayName = 'Power BI API';
  documentationUrl = 'https://docs.microsoft.com/en-us/power-bi/developer/embedded/get-azuread-access-token';
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
      type: 'hidden',
      default: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'hidden',
      default: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'hidden',
      default: 'https://analysis.windows.net/powerbi/api/.default',
    },
    {
      displayName: 'Auth URI Query Parameters',
      name: 'authQueryParameters',
      type: 'hidden',
      default: 'response_mode=query',
    },
    {
      displayName: 'Authentication',
      name: 'authentication',
      type: 'hidden',
      default: 'body',
    },
  ];
}
```

**Advanced Power BI Node with Retry Logic:**
```ts
export class AdvancedPowerBINode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Advanced Power BI',
    name: 'advancedPowerBI',
    icon: 'file:powerbi.svg',
    group: ['output'],
    version: 1,
    description: 'Advanced Power BI integration with retry logic and error handling',
    defaults: {
      name: 'Advanced Power BI',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'powerBIApi',
        required: true,
      },
    ],
    properties: [
      // ... existing properties ...
      {
        displayName: 'Advanced Options',
        name: 'advancedOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Clear Table Before Insert',
            name: 'clearTable',
            type: 'boolean',
            default: false,
            description: 'Clear all rows from table before inserting new data',
          },
          {
            displayName: 'Retry Failed Batches',
            name: 'retryFailedBatches',
            type: 'boolean',
            default: true,
            description: 'Retry failed batches up to 3 times',
          },
          {
            displayName: 'Max Retry Attempts',
            name: 'maxRetries',
            type: 'number',
            default: 3,
            description: 'Maximum number of retry attempts for failed batches',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;
    
    // Get advanced options
    const advancedOptions = this.getNodeParameter('advancedOptions', 0, {}) as any;
    const retryFailedBatches = advancedOptions.retryFailedBatches ?? true;
    const maxRetries = advancedOptions.maxRetries ?? 3;
    const clearTable = advancedOptions.clearTable ?? false;

    if (operation === 'pushRows') {
      const workspaceId = this.getNodeParameter('workspaceId', 0) as string;
      const datasetId = this.getNodeParameter('datasetId', 0) as string;
      const tableName = this.getNodeParameter('tableName', 0) as string;
      const batchSize = this.getNodeParameter('batchSize', 0) as number;
      const baseUrl = 'https://api.powerbi.com/v1.0/myorg';

      // Clear table if requested
      if (clearTable) {
        try {
          await this.helpers.requestWithAuthentication.call(
            this,
            'powerBIApi',
            {
              method: 'DELETE',
              url: `${baseUrl}/groups/${workspaceId}/datasets/${datasetId}/tables/${tableName}/rows`,
              json: true,
            }
          );

          returnData.push({
            json: {
              operation: 'clearTable',
              status: 'success',
              message: 'Table cleared successfully',
            },
          });
        } catch (error) {
          throw new NodeApiError(this.getNode(), error, {
            message: 'Failed to clear table before insert',
          });
        }
      }

      // Process items in batches with retry logic
      const batches: any[][] = [];
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }

      let totalRowsPushed = 0;
      let totalFailedBatches = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        let retryCount = 0;
        let success = false;

        while (!success && retryCount <= maxRetries) {
          try {
            const rows = batch.map(item => item.json);

            await this.helpers.requestWithAuthentication.call(
              this,
              'powerBIApi',
              {
                method: 'POST',
                url: `${baseUrl}/groups/${workspaceId}/datasets/${datasetId}/tables/${tableName}/rows`,
                body: { rows },
                json: true,
              }
            );

            success = true;
            totalRowsPushed += rows.length;

            returnData.push({
              json: {
                batchIndex: batchIndex + 1,
                rowsInBatch: rows.length,
                retryCount,
                status: 'success',
              },
            });

          } catch (error) {
            retryCount++;
            
            if (retryCount > maxRetries || !retryFailedBatches) {
              totalFailedBatches++;
              
              if (this.continueOnFail()) {
                returnData.push({
                  json: {
                    batchIndex: batchIndex + 1,
                    rowsInBatch: batch.length,
                    retryCount: retryCount - 1,
                    error: error.message,
                    status: 'failed',
                  },
                });
                break;
              }
              throw error;
            }

            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Add final summary
      returnData.push({
        json: {
          operation: 'pushRows',
          summary: {
            totalBatches: batches.length,
            successfulBatches: batches.length - totalFailedBatches,
            failedBatches: totalFailedBatches,
            totalRowsPushed,
            retryEnabled: retryFailedBatches,
            maxRetries,
          },
        },
      });
    }

    return [returnData];
  }
}
```

**Usage Examples:**

1. **Push Sales Data:**
   ```json
   {
     "date": "2023-12-01",
     "product": "Widget A",
     "sales": 1250.50,
     "quantity": 25
   }
   ```

2. **Create Real-time Dashboard Dataset:**
   - Auto-generate schema from input data
   - Set to "Streaming" mode for real-time updates

3. **Batch Upload Analytics Data:**
   - Process 10,000 rows in batches of 1,000
   - Retry failed batches automatically

This Power BI node demonstrates:
- **OAuth2 integration** with Microsoft Azure AD
- **Batch processing** for large datasets
- **Schema auto-generation** from JSON data
- **Error handling and retries** for robust data pipelines
- **Multiple operations** (create, push, list datasets)
- **Advanced options** for fine-tuned control

Perfect for building real-time business intelligence dashboards and automated reporting workflows!
