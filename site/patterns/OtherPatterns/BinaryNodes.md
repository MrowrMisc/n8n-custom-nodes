# Binary Nodes

Binary nodes are designed to handle file data such as images, PDFs, or any other binary content. They work with the `binary` property on each item.

## Examples
- Read Binary File
- Move Binary Data
- HTTP Request (file download)

## Key Concepts
- Binary data is stored in `item.binary`
- Each binary property has metadata and a file buffer
- Use `this.helpers.prepareBinaryData()` to attach binary content
- Use `this.helpers.getBinaryStream()` to read binary content

## Use Cases
- Download a file from a URL
- Convert a file format
- Upload a file to an external service

## Binary Node that Reads a File

Here's how to create a node that reads a file and returns it as binary data:

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { readFile } from 'fs/promises';
import { basename } from 'path';

export class ReadBinaryFile implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Read Binary File',
    name: 'readBinaryFile',
    icon: 'file:file.svg',
    group: ['input'],
    version: 1,
    description: 'Reads a file from the filesystem and returns it as binary data',
    defaults: {
      name: 'Read Binary File',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'File Path',
        name: 'filePath',
        type: 'string',
        default: '',
        required: true,
        description: 'Path to the file to read',
        placeholder: '/path/to/file.pdf',
      },
      {
        displayName: 'Property Name',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        required: true,
        description: 'Name of the binary property to store the file data',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const filePath = this.getNodeParameter('filePath', i) as string;
      const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

      try {
        // Read the file from filesystem
        const fileBuffer = await readFile(filePath);
        const fileName = basename(filePath);
        
        // Prepare binary data
        const binaryData = await this.helpers.prepareBinaryData(
          fileBuffer,
          fileName,
        );

        // Return the item with binary data attached
        returnData.push({
          json: {
            fileName,
            filePath,
            fileSize: fileBuffer.length,
          },
          binary: {
            [binaryPropertyName]: binaryData,
          },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: `Failed to read file: ${error.message}`,
              filePath,
            },
          });
        } else {
          throw new NodeOperationError(
            this.getNode(),
            `Failed to read file '${filePath}': ${error.message}`,
            { itemIndex: i },
          );
        }
      }
    }

    return [returnData];
  }
}
```

This node reads a file from the filesystem and attaches it as binary data, making it available for other nodes to process or download.
