# Pagination

Pagination is used when an API returns results in pages. Your node must loop through all pages to collect the full dataset.

## Strategies
- Offset-based (e.g. `?page=2`)
- Cursor-based (e.g. `?next=abc123`)
- Link header-based (e.g. `Link: <url>; rel="next"`)

## Key Concepts
- Use a `while` loop in `execute()` to fetch all pages
- Append results to a single array
- Respect API rate limits and max page size

## Use Cases
- Fetch all users from a paginated API
- Download all records from a CRM
- Sync large datasets from external services

## Pagination Using `nextPage`

Here's how to implement pagination that loops through all pages of an API:

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
} from 'n8n-workflow';

export class PaginatedApiNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Paginated API',
    name: 'paginatedApi',
    icon: 'file:api.svg',
    group: ['input'],
    version: 1,
    description: 'Fetch all data from a paginated API',
    defaults: {
      name: 'Paginated API',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'myApiCredentials',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          {
            name: 'Users',
            value: 'users',
          },
          {
            name: 'Projects',
            value: 'projects',
          },
        ],
        default: 'users',
      },
      {
        displayName: 'Max Results',
        name: 'maxResults',
        type: 'number',
        default: 1000,
        description: 'Maximum number of results to fetch (0 = no limit)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const maxResults = this.getNodeParameter('maxResults', i) as number;
      const credentials = await this.getCredentials('myApiCredentials');

      let allResults: any[] = [];
      let nextPage: string | null = null;
      let pageCount = 0;
      const maxPages = 100; // Safety limit

      try {
        do {
          pageCount++;
          
          // Build request URL with pagination
          const url = new URL(`https://api.example.com/${resource}`);
          url.searchParams.set('limit', '50'); // Page size
          
          if (nextPage) {
            url.searchParams.set('page', nextPage);
          }

          const response = await this.helpers.request({
            method: 'GET',
            url: url.toString(),
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            json: true,
          });

          // Add results from this page
          if (response.data && Array.isArray(response.data)) {
            allResults = allResults.concat(response.data);
          }

          // Check for next page
          nextPage = response.pagination?.nextPage || null;
          
          // Safety checks
          if (pageCount >= maxPages) {
            console.warn(`Reached maximum page limit (${maxPages})`);
            break;
          }
          
          if (maxResults > 0 && allResults.length >= maxResults) {
            allResults = allResults.slice(0, maxResults);
            break;
          }
          
          // Rate limiting - small delay between requests
          if (nextPage) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } while (nextPage);

        // Return all collected results
        returnData.push({
          json: {
            resource,
            totalResults: allResults.length,
            pagesFetched: pageCount,
            data: allResults,
          },
        });
        
      } catch (error) {
        throw new NodeApiError(this.getNode(), error, {
          message: `Failed to fetch paginated data from ${resource}`,
          description: error.message,
        });
      }
    }

    return [returnData];
  }
}
```

This example demonstrates:
- Looping through all pages until no `nextPage` is returned
- Collecting results from all pages into a single array
- Safety limits to prevent infinite loops
- Rate limiting between requests
- Respecting a maximum result count
