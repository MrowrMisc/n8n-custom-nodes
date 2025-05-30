# Binary Data Manipulation

Working with binary data in n8n nodes allows you to handle files, images, documents, and other non-text content.

## Key Concepts
- Use `prepareBinaryData()` to create binary data objects
- Binary data includes metadata (filename, mimeType, fileExtension)
- Access binary data from input items or create new binary data
- Handle multiple binary properties per item

## Binary Data Structure
```ts
interface IBinaryData {
  data: string;           // Base64 encoded data
  mimeType: string;       // MIME type (e.g., 'image/png')
  fileName?: string;      // Original filename
  fileExtension?: string; // File extension
  directory?: string;     // Directory path (for file storage)
}
```

## Complete Binary Data Examples

### File Processing Node

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export class BinaryDataExample implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Binary Data Example',
    name: 'binaryDataExample',
    group: ['transform'],
    version: 1,
    description: 'Demonstrates comprehensive binary data handling',
    defaults: {
      name: 'Binary Data Example',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Read File',
            value: 'readFile',
            description: 'Read a file and convert to binary data',
          },
          {
            name: 'Write File',
            value: 'writeFile',
            description: 'Write binary data to a file',
          },
          {
            name: 'Convert Image',
            value: 'convertImage',
            description: 'Convert image format and resize',
          },
          {
            name: 'Create Archive',
            value: 'createArchive',
            description: 'Create a ZIP archive from multiple files',
          },
          {
            name: 'Extract Text',
            value: 'extractText',
            description: 'Extract text from PDF or document',
          },
          {
            name: 'Generate File',
            value: 'generateFile',
            description: 'Generate various file types',
          },
        ],
        default: 'readFile',
      },
      {
        displayName: 'File Path',
        name: 'filePath',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['readFile', 'writeFile'],
          },
        },
        default: '',
        description: 'Path to the file',
      },
      {
        displayName: 'Binary Property',
        name: 'binaryProperty',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['writeFile', 'convertImage', 'extractText'],
          },
        },
        default: 'data',
        description: 'Name of the binary property to process',
      },
      {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['convertImage'],
          },
        },
        options: [
          { name: 'PNG', value: 'png' },
          { name: 'JPEG', value: 'jpeg' },
          { name: 'WebP', value: 'webp' },
          { name: 'GIF', value: 'gif' },
        ],
        default: 'png',
        description: 'Output image format',
      },
      {
        displayName: 'File Type',
        name: 'fileType',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['generateFile'],
          },
        },
        options: [
          { name: 'CSV', value: 'csv' },
          { name: 'JSON', value: 'json' },
          { name: 'XML', value: 'xml' },
          { name: 'PDF', value: 'pdf' },
          { name: 'Image', value: 'image' },
        ],
        default: 'csv',
        description: 'Type of file to generate',
      },
      {
        displayName: 'Processing Options',
        name: 'processingOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Max File Size (MB)',
            name: 'maxFileSize',
            type: 'number',
            default: 50,
            description: 'Maximum file size to process',
          },
          {
            displayName: 'Preserve Metadata',
            name: 'preserveMetadata',
            type: 'boolean',
            default: true,
            description: 'Preserve file metadata when processing',
          },
          {
            displayName: 'Compression Level',
            name: 'compressionLevel',
            type: 'number',
            default: 6,
            description: 'Compression level (0-9)',
          },
          {
            displayName: 'Image Width',
            name: 'imageWidth',
            type: 'number',
            default: 800,
            description: 'Target image width for resizing',
          },
          {
            displayName: 'Image Height',
            name: 'imageHeight',
            type: 'number',
            default: 600,
            description: 'Target image height for resizing',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: INodeExecutionData;

        switch (operation) {
          case 'readFile':
            result = await this.readFile(i);
            break;
          case 'writeFile':
            result = await this.writeFile(i, items[i]);
            break;
          case 'convertImage':
            result = await this.convertImage(i, items[i]);
            break;
          case 'createArchive':
            result = await this.createArchive(i, items[i]);
            break;
          case 'extractText':
            result = await this.extractText(i, items[i]);
            break;
          case 'generateFile':
            result = await this.generateFile(i);
            break;
          default:
            throw new NodeOperationError(
              this.getNode(),
              `Unknown operation: ${operation}`,
              { itemIndex: i }
            );
        }

        returnData.push(result);

      } catch (error) {
        throw new NodeOperationError(
          this.getNode(),
          `Error in operation ${operation}: ${error.message}`,
          { itemIndex: i }
        );
      }
    }

    return [returnData];
  }

  private async readFile(itemIndex: number): Promise<INodeExecutionData> {
    const filePath = this.getNodeParameter('filePath', itemIndex) as string;
    const processingOptions = this.getNodeParameter('processingOptions', itemIndex, {}) as any;

    if (!filePath) {
      throw new NodeOperationError(
        this.getNode(),
        'File path is required',
        { itemIndex }
      );
    }

    try {
      // Check if file exists and get stats
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        throw new NodeOperationError(
          this.getNode(),
          `Path is not a file: ${filePath}`,
          { itemIndex }
        );
      }

      // Check file size
      const maxSize = (processingOptions.maxFileSize || 50) * 1024 * 1024;
      if (stats.size > maxSize) {
        throw new NodeOperationError(
          this.getNode(),
          `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: ${processingOptions.maxFileSize || 50}MB)`,
          { itemIndex }
        );
      }

      // Read file as buffer
      const buffer = await fs.readFile(filePath);
      
      // Determine MIME type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeType(ext);
      const fileName = path.basename(filePath);

      // Create binary data
      const binaryData = await this.helpers.prepareBinaryData(
        buffer,
        fileName,
        mimeType
      );

      // Calculate file hash for integrity
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      return {
        json: {
          success: true,
          fileName,
          filePath,
          fileSize: stats.size,
          fileSizeFormatted: this.formatFileSize(stats.size),
          mimeType,
          fileExtension: ext,
          hash,
          created: stats.birthtime,
          modified: stats.mtime,
        },
        binary: {
          data: binaryData,
        },
      };

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NodeOperationError(
          this.getNode(),
          `File not found: ${filePath}`,
          { itemIndex }
        );
      }
      throw error;
    }
  }

  private async writeFile(itemIndex: number, item: INodeExecutionData): Promise<INodeExecutionData> {
    const filePath = this.getNodeParameter('filePath', itemIndex) as string;
    const binaryProperty = this.getNodeParameter('binaryProperty', itemIndex) as string;

    if (!filePath) {
      throw new NodeOperationError(
        this.getNode(),
        'File path is required',
        { itemIndex }
      );
    }

    if (!item.binary || !item.binary[binaryProperty]) {
      throw new NodeOperationError(
        this.getNode(),
        `No binary data found in property: ${binaryProperty}`,
        { itemIndex }
      );
    }

    const binaryData = item.binary[binaryProperty];
    
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Convert base64 to buffer and write file
      const buffer = Buffer.from(binaryData.data, 'base64');
      await fs.writeFile(filePath, buffer);

      // Get file stats after writing
      const stats = await fs.stat(filePath);

      return {
        json: {
          success: true,
          filePath,
          fileName: binaryData.fileName || path.basename(filePath),
          fileSize: stats.size,
          fileSizeFormatted: this.formatFileSize(stats.size),
          mimeType: binaryData.mimeType,
          written: new Date().toISOString(),
        },
      };

    } catch (error) {
      throw new NodeOperationError(
        this.getNode(),
        `Failed to write file: ${error.message}`,
        { itemIndex }
      );
    }
  }

  private async convertImage(itemIndex: number, item: INodeExecutionData): Promise<INodeExecutionData> {
    const binaryProperty = this.getNodeParameter('binaryProperty', itemIndex) as string;
    const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
    const processingOptions = this.getNodeParameter('processingOptions', itemIndex, {}) as any;

    if (!item.binary || !item.binary[binaryProperty]) {
      throw new NodeOperationError(
        this.getNode(),
        `No binary data found in property: ${binaryProperty}`,
        { itemIndex }
      );
    }

    const binaryData = item.binary[binaryProperty];
    
    // Check if it's an image
    if (!binaryData.mimeType?.startsWith('image/')) {
      throw new NodeOperationError(
        this.getNode(),
        `Binary data is not an image: ${binaryData.mimeType}`,
        { itemIndex }
      );
    }

    try {
      // For this example, we'll simulate image processing
      // In a real implementation, you'd use a library like Sharp
      const inputBuffer = Buffer.from(binaryData.data, 'base64');
      
      // Simulate image conversion and resizing
      const processedBuffer = await this.simulateImageProcessing(
        inputBuffer,
        outputFormat,
        processingOptions.imageWidth || 800,
        processingOptions.imageHeight || 600
      );

      // Create new filename with new extension
      const originalName = binaryData.fileName || 'image';
      const baseName = path.parse(originalName).name;
      const newFileName = `${baseName}_converted.${outputFormat}`;
      const newMimeType = `image/${outputFormat}`;

      // Create new binary data
      const newBinaryData = await this.helpers.prepareBinaryData(
        processedBuffer,
        newFileName,
        newMimeType
      );

      return {
        json: {
          success: true,
          originalFormat: binaryData.mimeType,
          newFormat: newMimeType,
          originalSize: inputBuffer.length,
          newSize: processedBuffer.length,
          compressionRatio: ((inputBuffer.length - processedBuffer.length) / inputBuffer.length * 100).toFixed(2) + '%',
          dimensions: {
            width: processingOptions.imageWidth || 800,
            height: processingOptions.imageHeight || 600,
          },
        },
        binary: {
          data: newBinaryData,
        },
      };

    } catch (error) {
      throw new NodeOperationError(
        this.getNode(),
        `Image conversion failed: ${error.message}`,
        { itemIndex }
      );
    }
  }

  private async createArchive(itemIndex: number, item: INodeExecutionData): Promise<INodeExecutionData> {
    // Simulate creating a ZIP archive from multiple binary properties
    const archiveEntries: Array<{ name: string; data: Buffer }> = [];

    if (item.binary) {
      for (const [propertyName, binaryData] of Object.entries(item.binary)) {
        const buffer = Buffer.from(binaryData.data, 'base64');
        const fileName = binaryData.fileName || `${propertyName}.bin`;
        archiveEntries.push({ name: fileName, data: buffer });
      }
    }

    if (archiveEntries.length === 0) {
      throw new NodeOperationError(
        this.getNode(),
        'No binary data found to archive',
        { itemIndex }
      );
    }

    try {
      // Simulate ZIP creation (in real implementation, use a ZIP library)
      const archiveBuffer = await this.simulateZipCreation(archiveEntries);
      
      const archiveName = `archive_${Date.now()}.zip`;
      const binaryData = await this.helpers.prepareBinaryData(
        archiveBuffer,
        archiveName,
        'application/zip'
      );

      return {
        json: {
          success: true,
          archiveName,
          fileCount: archiveEntries.length,
          files: archiveEntries.map(entry => entry.name),
          archiveSize: archiveBuffer.length,
          archiveSizeFormatted: this.formatFileSize(archiveBuffer.length),
        },
        binary: {
          archive: binaryData,
        },
      };

    } catch (error) {
      throw new NodeOperationError(
        this.getNode(),
        `Archive creation failed: ${error.message}`,
        { itemIndex }
      );
    }
  }

  private async extractText(itemIndex: number, item: INodeExecutionData): Promise<INodeExecutionData> {
    const binaryProperty = this.getNodeParameter('binaryProperty', itemIndex) as string;

    if (!item.binary || !item.binary[binaryProperty]) {
      throw new NodeOperationError(
        this.getNode(),
        `No binary data found in property: ${binaryProperty}`,
        { itemIndex }
      );
    }

    const binaryData = item.binary[binaryProperty];
    const buffer = Buffer.from(binaryData.data, 'base64');

    try {
      let extractedText = '';
      let metadata: any = {};

      // Handle different file types
      if (binaryData.mimeType === 'application/pdf') {
        // Simulate PDF text extraction
        const result = await this.simulatePdfTextExtraction(buffer);
        extractedText = result.text;
        metadata = result.metadata;
      } else if (binaryData.mimeType?.includes('text/')) {
        // Handle text files
        extractedText = buffer.toString('utf-8');
        metadata = { encoding: 'utf-8', lineCount: extractedText.split('\n').length };
      } else if (binaryData.mimeType?.startsWith('image/')) {
        // Simulate OCR for images
        const result = await this.simulateOcrExtraction(buffer);
        extractedText = result.text;
        metadata = result.metadata;
      } else {
        throw new NodeOperationError(
          this.getNode(),
          `Unsupported file type for text extraction: ${binaryData.mimeType}`,
          { itemIndex }
        );
      }

      return {
        json: {
          success: true,
          fileName: binaryData.fileName,
          mimeType: binaryData.mimeType,
          extractedText,
          textLength: extractedText.length,
          wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
          metadata,
        },
      };

    } catch (error) {
      throw new NodeOperationError(
        this.getNode(),
        `Text extraction failed: ${error.message}`,
        { itemIndex }
      );
    }
  }

  private async generateFile(itemIndex: number): Promise<INodeExecutionData> {
    const fileType = this.getNodeParameter('fileType', itemIndex) as string;

    try {
      let buffer: Buffer;
      let fileName: string;
      let mimeType: string;

      switch (fileType) {
        case 'csv':
          const csvData = this.generateCsvData();
          buffer = Buffer.from(csvData, 'utf-8');
          fileName = `data_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;

        case 'json':
          const jsonData = this.generateJsonData();
          buffer = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8');
          fileName = `data_${Date.now()}.json`;
          mimeType = 'application/json';
          break;

        case 'xml':
          const xmlData = this.generateXmlData();
          buffer = Buffer.from(xmlData, 'utf-8');
          fileName = `data_${Date.now()}.xml`;
          mimeType = 'application/xml';
          break;

        case 'pdf':
          buffer = await this.generatePdfData();
          fileName = `document_${Date.now()}.pdf`;
          mimeType = 'application/pdf';
          break;

        case 'image':
          buffer = await this.generateImageData();
          fileName = `image_${Date.now()}.png`;
          mimeType = 'image/png';
          break;

        default:
          throw new NodeOperationError(
            this.getNode(),
            `Unsupported file type: ${fileType}`,
            { itemIndex }
          );
      }

      const binaryData = await this.helpers.prepareBinaryData(
        buffer,
        fileName,
        mimeType
      );

      return {
        json: {
          success: true,
          fileType,
          fileName,
          mimeType,
          fileSize: buffer.length,
          fileSizeFormatted: this.formatFileSize(buffer.length),
          generated: new Date().toISOString(),
        },
        binary: {
          data: binaryData,
        },
      };

    } catch (error) {
      throw new NodeOperationError(
        this.getNode(),
        `File generation failed: ${error.message}`,
        { itemIndex }
      );
    }
  }

  // Helper methods for file processing simulation
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.zip': 'application/zip',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private async simulateImageProcessing(
    buffer: Buffer,
    format: string,
    width: number,
    height: number
  ): Promise<Buffer> {
    // Simulate image processing - in real implementation use Sharp or similar
    // For demo, just return a smaller buffer to simulate compression
    const compressionRatio = 0.7;
    const newSize = Math.floor(buffer.length * compressionRatio);
    return Buffer.alloc(newSize, buffer[0]);
  }

  private async simulateZipCreation(entries: Array<{ name: string; data: Buffer }>): Promise<Buffer> {
    // Simulate ZIP creation - in real implementation use node-stream-zip or similar
    const totalSize = entries.reduce((sum, entry) => sum + entry.data.length, 0);
    const zipHeader = Buffer.from('PK\x03\x04'); // ZIP file signature
    const simulatedZip = Buffer.concat([zipHeader, Buffer.alloc(totalSize * 0.8)]);
    return simulatedZip;
  }

  private async simulatePdfTextExtraction(buffer: Buffer): Promise<{ text: string; metadata: any }> {
    // Simulate PDF text extraction - in real implementation use pdf-parse or similar
    return {
      text: 'This is simulated text extracted from a PDF document. In a real implementation, you would use a PDF parsing library.',
      metadata: {
        pages: 1,
        title: 'Sample Document',
        author: 'n8n',
        creationDate: new Date().toISOString(),
      },
    };
  }

  private async simulateOcrExtraction(buffer: Buffer): Promise<{ text: string; metadata: any }> {
    // Simulate OCR text extraction - in real implementation use tesseract.js or similar
    return {
      text: 'This is simulated text extracted from an image using OCR. In a real implementation, you would use an OCR library.',
      metadata: {
        confidence: 0.95,
        language: 'eng',
        processingTime: '2.3s',
      },
    };
  }

  private generateCsvData(): string {
    const headers = ['ID', 'Name', 'Email', 'Age', 'City'];
    const rows = [
      ['1', 'John Doe', 'john@example.com', '30', 'New York'],
      ['2', 'Jane Smith', 'jane@example.com', '25', 'Los Angeles'],
      ['3', 'Bob Johnson', 'bob@example.com', '35', 'Chicago'],
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateJsonData(): any {
    return {
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, city: 'New York' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, city: 'Los Angeles' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, city: 'Chicago' },
      ],
      metadata: {
        generated: new Date().toISOString(),
        count: 3,
        version: '1.0',
      },
    };
  }

  private generateXmlData(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user id="1">
    <name>John Doe</name>
    <email>john@example.com</email>
    <age>30</age>
    <city>New York</city>
  </user>
  <user id="2">
    <name>Jane Smith</name>
    <email>jane@example.com</email>
    <age>25</age>
    <city>Los Angeles</city>
  </user>
  <user id="3">
    <name>Bob Johnson</name>
    <email>bob@example.com</email>
    <age>35</age>
    <city>Chicago</city>
  </user>
</users>`;
  }

  private async generatePdfData(): Promise<Buffer> {
    // Simulate PDF generation - in real implementation use PDFKit or similar
    const pdfHeader = Buffer.from('%PDF-1.4\n');
    const pdfContent = Buffer.from('Simulated PDF content');
    return Buffer.concat([pdfHeader, pdfContent]);
  }

  private async generateImageData(): Promise<Buffer> {
    // Simulate image generation - in real implementation use Canvas or similar
    // Create a simple PNG header for demonstration
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const simulatedImageData = Buffer.alloc(1000, 0xFF); // White pixels
    return Buffer.concat([pngSignature, simulatedImageData]);
  }
}
```

**Key Binary Data Patterns:**

1. **Reading Files:**
   ```ts
   const buffer = await fs.readFile(filePath);
   const binaryData = await this.helpers.prepareBinaryData(buffer, fileName, mimeType);
   ```

2. **Writing Files:**
   ```ts
   const buffer = Buffer.from(binaryData.data, 'base64');
   await fs.writeFile(filePath, buffer);
   ```

3. **Processing Binary Data:**
   ```ts
   const inputBuffer = Buffer.from(binaryData.data, 'base64');
   const processedBuffer = await processImage(inputBuffer);
   const newBinaryData = await this.helpers.prepareBinaryData(processedBuffer, newFileName, newMimeType);
   ```

4. **Multiple Binary Properties:**
   ```ts
   return {
     json: { success: true },
     binary: {
       original: originalBinaryData,
       processed: processedBinaryData,
       thumbnail: thumbnailBinaryData,
     },
   };
   ```

5. **Binary Data Validation:**
   ```ts
   if (!item.binary || !item.binary[binaryProperty]) {
     throw new NodeOperationError(this.getNode(), `No binary data found in property: ${binaryProperty}`);
   }
   ```

This comprehensive binary data handling approach enables nodes to work with any type of file or binary content efficiently and safely!
