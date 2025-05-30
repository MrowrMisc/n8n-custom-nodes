# Trigger Nodes

Trigger nodes are special nodes that start a workflow when an external event occurs. They do not require input and are typically the first node in a workflow.

## Examples
- Webhook Trigger
- Schedule Trigger
- Polling-based Triggers (e.g. RSS, Email)

## Key Concepts
- Must define `trigger` property in the node description
- Can use `webhookMethods`, `polling`, or `interval` strategies
- Must return data in the same format as regular nodes

## Use Cases
- Start a workflow when a form is submitted
- Run a workflow every hour
- React to a new email or webhook

## Trigger Node with Polling

Here's how to create a polling trigger that checks for new data on a schedule:

```ts
import {
  ITriggerFunctions,
  INodeType,
  INodeTypeDescription,
  ITriggerResponse,
  INodeExecutionData,
} from 'n8n-workflow';

export class MyPollingTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Polling Trigger',
    name: 'myPollingTrigger',
    icon: 'file:trigger.svg',
    group: ['trigger'],
    version: 1,
    description: 'Polls an API for new data',
    defaults: {
      name: 'My Polling Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'myApiCredentials',
        required: true,
      },
    ],
    polling: true,
    properties: [
      {
        displayName: 'Trigger On',
        name: 'event',
        type: 'options',
        options: [
          {
            name: 'New User',
            value: 'newUser',
          },
          {
            name: 'Updated Project',
            value: 'updatedProject',
          },
        ],
        default: 'newUser',
      },
    ],
  };

  async poll(this: ITriggerFunctions): Promise<INodeExecutionData[][] | null> {
    const event = this.getNodeParameter('event') as string;
    const credentials = await this.getCredentials('myApiCredentials');
    
    try {
      const response = await this.helpers.request({
        method: 'GET',
        url: `https://api.example.com/${event === 'newUser' ? 'users' : 'projects'}`,
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
        qs: {
          since: this.getLastPollTime(),
        },
        json: true,
      });
      
      if (response.data && response.data.length > 0) {
        return [response.data.map((item: any) => ({ json: item }))];
      }
      
      return null; // No new data
    } catch (error) {
      throw new Error(`Polling failed: ${error.message}`);
    }
  }
}
```

This trigger polls the API every time the workflow is scheduled to run, checking for new data since the last poll time.
