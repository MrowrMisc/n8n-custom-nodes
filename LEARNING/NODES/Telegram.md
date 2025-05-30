# Telegram Node - Implementation Patterns

## Key Learning Points

### 1. API Integration Node Structure
```typescript
export class Telegram implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Telegram',
    group: ['output'],
    credentials: [{ name: 'telegramApi', required: true }],
    usableAsTool: true,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  };
}
```
- Uses `group: ['output']` for API nodes that send data
- Requires specific credentials for authentication
- `usableAsTool: true` enables AI agent usage
- Dynamic subtitle shows current operation

### 2. Resource/Operation Pattern
```typescript
properties: [
  {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    options: [
      { name: 'Chat', value: 'chat' },
      { name: 'Message', value: 'message' },
      { name: 'File', value: 'file' },
      { name: 'Callback', value: 'callback' },
    ],
    default: 'message',
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['message'] } },
    options: [
      { name: 'Send Message', value: 'sendMessage' },
      { name: 'Send Photo', value: 'sendPhoto' },
      // ... more operations
    ],
  }
]
```
- Two-level hierarchy: Resource → Operation
- Conditional operation display based on resource
- Clear action descriptions for each operation

### 3. Binary Data Handling
```typescript
{
  displayName: 'Binary File',
  name: 'binaryData',
  type: 'boolean',
  default: false,
  required: true,
  displayOptions: {
    show: {
      operation: ['sendPhoto', 'sendDocument', 'sendVideo'],
    },
  },
},
{
  displayName: 'Input Binary Field',
  name: 'binaryPropertyName',
  type: 'string',
  default: 'data',
  displayOptions: {
    show: { binaryData: [true] },
  },
}
```
- Toggle between binary data and URL/file_id
- Configurable binary property name
- Operation-specific binary handling

### 4. Complex UI Components
```typescript
{
  displayName: 'Inline Keyboard',
  name: 'inlineKeyboard',
  type: 'fixedCollection',
  typeOptions: { multipleValues: true },
  options: [
    {
      displayName: 'Rows',
      name: 'rows',
      values: [
        {
          displayName: 'Row',
          name: 'row',
          type: 'fixedCollection',
          typeOptions: { multipleValues: true },
          options: [
            {
              displayName: 'Buttons',
              name: 'buttons',
              values: [/* button fields */]
            }
          ]
        }
      ]
    }
  ]
}
```
- Nested `fixedCollection` for complex structures
- Multiple levels of configuration
- Dynamic keyboard building

### 5. Generic Functions Pattern
```typescript
// GenericFunctions.ts
export async function apiRequest(
  this: IExecuteFunctions | IWebhookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject,
  query?: IDataObject,
  option: IDataObject = {},
): Promise<any> {
  const credentials = await this.getCredentials('telegramApi');
  
  const options: IRequestOptions = {
    method,
    uri: `${credentials.baseUrl}/bot${credentials.accessToken}/${endpoint}`,
    body,
    qs: query,
    json: true,
  };
  
  return await this.helpers.request(options);
}
```
- Centralized API request handling
- Credential integration
- Flexible options parameter

### 6. Send and Wait Pattern
```typescript
webhook = sendAndWaitWebhook;

if (resource === 'message' && operation === SEND_AND_WAIT_OPERATION) {
  body = createSendAndWaitMessageBody(this);
  await apiRequest.call(this, 'POST', 'sendMessage', body);
  
  const waitTill = configureWaitTillDate(this);
  await this.putExecutionToWait(waitTill);
  return [this.getInputData()];
}
```
- Interactive workflow pattern
- Webhook integration for responses
- Execution suspension with `putExecutionToWait()`

### 7. Binary File Upload
```typescript
if (binaryData) {
  const itemBinaryData = items[i].binary![binaryPropertyName];
  const propertyName = getPropertyName(operation);
  
  let uploadData: Buffer | Readable;
  if (itemBinaryData.id) {
    uploadData = await this.helpers.getBinaryStream(itemBinaryData.id);
  } else {
    uploadData = Buffer.from(itemBinaryData.data, BINARY_ENCODING);
  }
  
  const formData = {
    ...body,
    [propertyName]: {
      value: uploadData,
      options: {
        filename,
        contentType: itemBinaryData.mimeType,
      },
    },
  };
  
  responseData = await apiRequest.call(this, requestMethod, endpoint, {}, qs, {
    formData,
  });
}
```
- Handles both buffer and stream data
- Dynamic property naming based on operation
- Proper multipart form data construction

### 8. Attribution and Branding
```typescript
export function addAdditionalFields(
  this: IExecuteFunctions,
  body: IDataObject,
  index: number,
  nodeVersion?: number,
  instanceId?: string,
) {
  if (operation === 'sendMessage') {
    const attributionText = 'This message was sent automatically with ';
    const link = createUtmCampaignLink('n8n-nodes-base.telegram', instanceId);
    
    if (additionalFields.appendAttribution) {
      if (additionalFields.parse_mode === 'Markdown') {
        body.text = `${body.text}\n\n_${attributionText}_[n8n](${link})`;
      } else if (additionalFields.parse_mode === 'HTML') {
        body.text = `${body.text}\n\n<em>${attributionText}</em><a href="${link}" target="_blank">n8n</a>`;
      }
    }
  }
}
```
- Optional attribution for branding
- Format-aware text appending
- UTM campaign tracking

### 9. File Download Handling
```typescript
if (resource === 'file' && operation === 'get') {
  if (this.getNodeParameter('download', i, false)) {
    const filePath = responseData.result.file_path;
    const credentials = await this.getCredentials('telegramApi');
    
    const file = await apiRequest.call(this, 'GET', '', {}, {}, {
      json: false,
      encoding: null,
      uri: `${credentials.baseUrl}/file/bot${credentials.accessToken}/${filePath}`,
      useStream: true,
    });
    
    const data = await this.helpers.prepareBinaryData(
      file.body as Buffer,
      fileName as string,
    );
    
    returnData.push({
      json: responseData,
      binary: { data },
      pairedItem: { item: i },
    });
  }
}
```
- Two-step file retrieval process
- Binary data preparation
- Proper paired item tracking

### 10. Error Handling and Execution Metadata
```typescript
try {
  // ... operation logic
  
  const executionData = this.helpers.constructExecutionMetaData(
    this.helpers.returnJsonArray(responseData as IDataObject[]),
    { itemData: { item: i } },
  );
  returnData.push(...executionData);
} catch (error) {
  if (this.continueOnFail()) {
    const executionErrorData = this.helpers.constructExecutionMetaData(
      this.helpers.returnJsonArray({ error: error.description ?? error.message }),
      { itemData: { item: i } },
    );
    returnData.push(...executionErrorData);
    continue;
  }
  throw error;
}
```
- Proper execution metadata construction
- Continue-on-fail error handling
- Item-level error tracking

### 11. Implementation Patterns
- **API Integration**: Use resource/operation hierarchy for complex APIs
- **Binary Handling**: Support both binary data and external references
- **Complex UI**: Use nested `fixedCollection` for structured data
- **Generic Functions**: Centralize API logic in separate module
- **Interactive Workflows**: Implement send-and-wait patterns
- **File Operations**: Handle both upload and download scenarios

### 12. Reusable Patterns
- Use `group: ['output']` for API nodes that send data
- Implement resource/operation two-level navigation
- Create generic functions for API request handling
- Support both binary and URL-based file operations
- Use `fixedCollection` for complex nested structures
- Implement proper error handling with execution metadata
- Add optional attribution for branding
- Use conditional display options extensively
- Handle file uploads with proper form data construction
- Implement interactive patterns with webhook integration
