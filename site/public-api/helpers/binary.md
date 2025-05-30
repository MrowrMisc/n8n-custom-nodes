# Binary Helpers

Binary helpers provide methods for working with binary data, files, and attachments in n8n nodes.

## Available Methods

### <a id="preparebinarydata"></a>`prepareBinaryData(binaryData, filePath?, mimeType?)`
Prepares binary data for use in n8n workflows.

```ts
prepareBinaryData(
  binaryData: Buffer | Readable,
  filePath?: string,
  mimeType?: string,
): Promise<IBinaryData>
```

**Parameters:**
- `binaryData` - Buffer or Readable stream containing the binary data
- `filePath` - Optional filename (used for display and download)
- `mimeType` - Optional MIME type (auto-detected if not provided)

**Returns:** `IBinaryData` object that can be attached to node output

**Example:**
```ts
// From Buffer
const buffer = Buffer.from('Hello World', 'utf8');
const binaryData = await this.helpers.prepareBinaryData(
  buffer,
  'hello.txt',
  'text/plain'
);

// From file download
const response = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://example.com/document.pdf',
  encoding: 'arraybuffer',
});

const binaryData = await this.helpers.prepareBinaryData(
  Buffer.from(response),
  'document.pdf',
  'application/pdf'
);

// Return with binary data
return [{
  json: { success: true },
  binary: { data: binaryData },
}];
```

### <a id="getbinarydatabuffer"></a>`getBinaryDataBuffer(itemIndex, propertyName)`
Gets binary data as a Buffer from a specific item and property.

```ts
getBinaryDataBuffer(itemIndex: number, propertyName: string): Promise<Buffer>
```

**Parameters:**
- `itemIndex` - Index of the item containing the binary data
- `propertyName` - Name of the binary property

**Example:**
```ts
// Get binary data from input
const buffer = await this.helpers.getBinaryDataBuffer(0, 'data');

// Process the buffer
const processedBuffer = processImage(buffer);

// Create new binary data
const newBinaryData = await this.helpers.prepareBinaryData(
  processedBuffer,
  'processed-image.jpg',
  'image/jpeg'
);
```

### <a id="assertbinarydata"></a>`assertBinaryData(itemIndex, propertyName)`
Asserts that binary data exists and returns it, throwing an error if not found.

```ts
assertBinaryData(itemIndex: number, propertyName: string): IBinaryData
```

**Parameters:**
- `itemIndex` - Index of the item containing the binary data
- `propertyName` - Name of the binary property

**Example:**
```ts
// Ensure binary data exists before processing
const binaryData = this.helpers.assertBinaryData(0, 'data');

console.log(binaryData.fileName); // Original filename
console.log(binaryData.mimeType); // MIME type
console.log(binaryData.fileSize); // File size in bytes
```

### `setBinaryDataBuffer(data, binaryData)`
Updates binary data with a new buffer.

```ts
setBinaryDataBuffer(data: IBinaryData, binaryData: Buffer): Promise<IBinaryData>
```

**Parameters:**
- `data` - Existing IBinaryData object
- `binaryData` - New buffer to set

**Example:**
```ts
const existingBinary = this.helpers.assertBinaryData(0, 'data');
const buffer = await this.helpers.getBinaryDataBuffer(0, 'data');

// Process the buffer
const processedBuffer = await processFile(buffer);

// Update the binary data
const updatedBinary = await this.helpers.setBinaryDataBuffer(
  existingBinary,
  processedBuffer
);
```

### `binaryToBuffer(body)`
Converts binary data to a Buffer.

```ts
binaryToBuffer(body: Buffer | Readable): Promise<Buffer>
```

**Example:**
```ts
const stream = getReadableStream();
const buffer = await this.helpers.binaryToBuffer(stream);
```

### <a id="binarytostring"></a>`binaryToString(body, encoding?)`
Converts binary data to a string.

```ts
binaryToString(body: Buffer | Readable, encoding?: BufferEncoding): Promise<string>
```

**Parameters:**
- `body` - Buffer or Readable stream
- `encoding` - Text encoding (default: 'utf8')

**Example:**
```ts
const buffer = await this.helpers.getBinaryDataBuffer(0, 'data');
const text = await this.helpers.binaryToString(buffer, 'utf8');
console.log(text); // File contents as string
```

### `detectBinaryEncoding(buffer)`
Detects the text encoding of a buffer.

```ts
detectBinaryEncoding(buffer: Buffer): string
```

**Example:**
```ts
const buffer = await this.helpers.getBinaryDataBuffer(0, 'data');
const encoding = this.helpers.detectBinaryEncoding(buffer);
console.log(encoding); // 'utf8', 'ascii', 'utf16le', etc.

const text = await this.helpers.binaryToString(buffer, encoding as BufferEncoding);
```

## Binary Data Structure

### `IBinaryData` Interface
```ts
interface IBinaryData {
  data: string;           // Base64 encoded data or file ID
  mimeType: string;       // MIME type (e.g., 'image/jpeg')
  fileName?: string;      // Original filename
  directory?: string;     // Storage directory
  fileExtension?: string; // File extension
  fileSize?: string;      // File size in bytes (as string)
  id?: string;           // Unique identifier
}
```

## Common Use Cases

### File Processing
```ts
async function processFile(this: IExecuteFunctions, itemIndex: number) {
  // Get the input binary data
  const binaryData = this.helpers.assertBinaryData(itemIndex, 'data');
  const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, 'data');
  
  // Process based on file type
  if (binaryData.mimeType?.startsWith('image/')) {
    return await processImage(buffer, binaryData.fileName);
  } else if (binaryData.mimeType === 'application/pdf') {
    return await processPDF(buffer, binaryData.fileName);
  } else if (binaryData.mimeType?.startsWith('text/')) {
    const text = await this.helpers.binaryToString(buffer);
    return await processText(text, binaryData.fileName);
  }
  
  throw new NodeOperationError(
    this.getNode(),
    `Unsupported file type: ${binaryData.mimeType}`
  );
}
```

### File Download
```ts
async function downloadFile(this: IExecuteFunctions, url: string, filename?: string) {
  const response = await this.helpers.httpRequest({
    method: 'GET',
    url,
    encoding: 'arraybuffer',
    returnFullResponse: true,
  });
  
  // Extract filename from URL or Content-Disposition header
  const finalFilename = filename || 
    extractFilenameFromHeader(response.headers['content-disposition']) ||
    url.split('/').pop() ||
    'downloaded-file';
  
  // Get MIME type from response
  const mimeType = response.headers['content-type'] || 'application/octet-stream';
  
  const binaryData = await this.helpers.prepareBinaryData(
    Buffer.from(response.body),
    finalFilename,
    mimeType
  );
  
  return {
    json: {
      filename: finalFilename,
      size: response.body.length,
      mimeType,
    },
    binary: { data: binaryData },
  };
}
```

### File Upload
```ts
async function uploadFile(this: IExecuteFunctions, itemIndex: number, uploadUrl: string) {
  const binaryData = this.helpers.assertBinaryData(itemIndex, 'data');
  const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, 'data');
  
  const formData = new FormData();
  formData.append('file', buffer, {
    filename: binaryData.fileName || 'upload',
    contentType: binaryData.mimeType,
  });
  
  const response = await this.helpers.httpRequest({
    method: 'POST',
    url: uploadUrl,
    body: formData,
    headers: formData.getHeaders(),
  });
  
  return {
    json: {
      uploaded: true,
      filename: binaryData.fileName,
      response,
    },
  };
}
```

### Text File Processing
```ts
async function processTextFile(this: IExecuteFunctions, itemIndex: number) {
  const binaryData = this.helpers.assertBinaryData(itemIndex, 'data');
  const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, 'data');
  
  // Detect encoding
  const encoding = this.helpers.detectBinaryEncoding(buffer);
  
  // Convert to string
  const content = await this.helpers.binaryToString(buffer, encoding as BufferEncoding);
  
  // Process content (e.g., parse CSV, JSON, etc.)
  let processedData;
  if (binaryData.fileName?.endsWith('.json')) {
    processedData = JSON.parse(content);
  } else if (binaryData.fileName?.endsWith('.csv')) {
    processedData = parseCSV(content);
  } else {
    processedData = { content, lines: content.split('\n').length };
  }
  
  return {
    json: {
      filename: binaryData.fileName,
      encoding,
      size: buffer.length,
      ...processedData,
    },
  };
}
```

### Image Processing
```ts
async function processImage(this: IExecuteFunctions, itemIndex: number) {
  const binaryData = this.helpers.assertBinaryData(itemIndex, 'data');
  
  if (!binaryData.mimeType?.startsWith('image/')) {
    throw new NodeOperationError(
      this.getNode(),
      'Input must be an image file'
    );
  }
  
  const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, 'data');
  
  // Process image (example: resize)
  const processedBuffer = await resizeImage(buffer, 800, 600);
  
  // Create new binary data
  const newBinaryData = await this.helpers.prepareBinaryData(
    processedBuffer,
    `resized-${binaryData.fileName}`,
    binaryData.mimeType
  );
  
  return {
    json: {
      originalSize: buffer.length,
      newSize: processedBuffer.length,
      filename: binaryData.fileName,
    },
    binary: { data: newBinaryData },
  };
}
```

### Multiple Binary Properties
```ts
async function handleMultipleBinaries(this: IExecuteFunctions) {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const newBinary: IBinaryKeyData = {};
    
    // Process each binary property
    if (item.binary) {
      for (const [key, binaryData] of Object.entries(item.binary)) {
        const buffer = await this.helpers.getBinaryDataBuffer(i, key);
        
        // Process the binary data
        const processedBuffer = await processFile(buffer);
        
        // Create new binary data
        newBinary[`processed_${key}`] = await this.helpers.prepareBinaryData(
          processedBuffer,
          `processed-${binaryData.fileName}`,
          binaryData.mimeType
        );
      }
    }
    
    returnData.push({
      json: item.json,
      binary: newBinary,
      pairedItem: { item: i },
    });
  }
  
  return [returnData];
}
```

## File Type Detection

### MIME Type Utilities
```ts
function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/json': 'json',
    'application/xml': 'xml',
    'application/zip': 'zip',
  };
  
  return extensions[mimeType] || 'bin';
}
```

## Error Handling

### Safe Binary Access
```ts
function safeBinaryAccess(this: IExecuteFunctions, itemIndex: number, propertyName: string) {
  try {
    return this.helpers.assertBinaryData(itemIndex, propertyName);
  } catch (error) {
    throw new NodeOperationError(
      this.getNode(),
      `No binary data found at property "${propertyName}" for item ${itemIndex}`,
      { itemIndex }
    );
  }
}
```

### File Size Validation
```ts
function validateFileSize(binaryData: IBinaryData, maxSizeMB: number = 10) {
  const fileSizeBytes = parseInt(binaryData.fileSize || '0', 10);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (fileSizeBytes > maxSizeBytes) {
    throw new NodeOperationError(
      this.getNode(),
      `File size (${Math.round(fileSizeBytes / 1024 / 1024)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
    );
  }
}
```

## Best Practices

### 1. Always Check Binary Data Exists
```ts
// ✅ Good - Check before accessing
if (item.binary?.data) {
  const binaryData = this.helpers.assertBinaryData(i, 'data');
  // Process binary data
}

// ❌ Bad - Assume binary data exists
const binaryData = this.helpers.assertBinaryData(i, 'data'); // May throw
```

### 2. Handle Large Files Efficiently
```ts
// ✅ Good - Stream processing for large files
const stream = createReadStream(filePath);
const binaryData = await this.helpers.prepareBinaryData(stream, filename);

// ❌ Bad - Loading entire file into memory
const buffer = readFileSync(filePath);
const binaryData = await this.helpers.prepareBinaryData(buffer, filename);
```

### 3. Preserve Original Metadata
```ts
// ✅ Good - Preserve original filename and MIME type
const originalBinary = this.helpers.assertBinaryData(i, 'data');
const processedBinary = await this.helpers.prepareBinaryData(
  processedBuffer,
  originalBinary.fileName,
  originalBinary.mimeType
);

// ❌ Bad - Lose original metadata
const processedBinary = await this.helpers.prepareBinaryData(processedBuffer);
```

### 4. Use Appropriate Property Names
```ts
// ✅ Good - Descriptive property names
return [{
  json: item.json,
  binary: {
    original: originalBinary,
    thumbnail: thumbnailBinary,
    processed: processedBinary,
  },
}];

// ❌ Bad - Generic property names
return [{
  json: item.json,
  binary: {
    data1: originalBinary,
    data2: thumbnailBinary,
    data3: processedBinary,
  },
}];
```

## See Also

- [IExecuteFunctions](../execution-contexts/IExecuteFunctions) - Main execution context
- [HTTP Helpers](./http) - Making HTTP requests
- [Filesystem Helpers](./filesystem) - File system operations
- [Binary Data Advanced](../../advanced/BinaryData) - Advanced binary data handling
