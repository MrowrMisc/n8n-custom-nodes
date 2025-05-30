---
title: Filesystem Helpers
description: Helper functions for file system operations in n8n nodes
---

# Filesystem Helpers

The filesystem helpers provide utilities for working with files and directories within n8n nodes. These functions handle common file operations while respecting n8n's security constraints and execution environment.

## When to Use

Use filesystem helpers when your node needs to:
- Read or write temporary files during execution
- Process file uploads or downloads
- Work with local file storage
- Handle file metadata and properties
- Manage temporary directories for processing

## Available Functions

### `writeTemporaryFile()`

Writes data to a temporary file that will be cleaned up after execution.

```typescript
import { IExecuteFunctions } from 'n8n-workflow'

export async function execute(this: IExecuteFunctions) {
  const data = this.getInputData()
  
  // Write temporary file
  const tempFilePath = await this.helpers.writeTemporaryFile(
    Buffer.from('Hello, World!'),
    'temp-file.txt'
  )
  
  // Use the file path for further processing
  console.log('Temporary file created at:', tempFilePath)
  
  return [data]
}
```

### `readTemporaryFile()`

Reads data from a temporary file.

```typescript
export async function execute(this: IExecuteFunctions) {
  const filePath = this.getNodeParameter('filePath', 0) as string
  
  try {
    const fileContent = await this.helpers.readTemporaryFile(filePath)
    
    return [{
      json: {
        content: fileContent.toString(),
        size: fileContent.length
      }
    }]
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`)
  }
}
```

### `createTemporaryDirectory()`

Creates a temporary directory for file operations.

```typescript
export async function execute(this: IExecuteFunctions) {
  const tempDir = await this.helpers.createTemporaryDirectory()
  
  // Use the directory for multiple file operations
  const file1Path = path.join(tempDir, 'file1.txt')
  const file2Path = path.join(tempDir, 'file2.txt')
  
  // Directory will be cleaned up automatically
  
  return [{ json: { tempDirectory: tempDir } }]
}
```

## Common Patterns

### Processing Multiple Files

```typescript
export async function execute(this: IExecuteFunctions) {
  const items = this.getInputData()
  const returnData = []
  
  for (let i = 0; i < items.length; i++) {
    const binaryData = this.helpers.assertBinaryData(i, 'data')
    
    // Write binary data to temporary file
    const tempFile = await this.helpers.writeTemporaryFile(
      binaryData.data,
      binaryData.fileName || 'input-file'
    )
    
    // Process the file
    const processedContent = await processFile(tempFile)
    
    returnData.push({
      json: {
        originalFileName: binaryData.fileName,
        processedSize: processedContent.length
      },
      binary: {
        data: await this.helpers.prepareBinaryData(
          Buffer.from(processedContent),
          `processed-${binaryData.fileName}`
        )
      }
    })
  }
  
  return [returnData]
}
```

### File Validation and Metadata

```typescript
export async function execute(this: IExecuteFunctions) {
  const filePath = this.getNodeParameter('filePath', 0) as string
  
  try {
    // Check if file exists and get metadata
    const stats = await this.helpers.getFileStats(filePath)
    
    if (!stats.isFile()) {
      throw new Error('Path does not point to a file')
    }
    
    // Validate file size
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (stats.size > maxSize) {
      throw new Error('File too large')
    }
    
    return [{
      json: {
        fileName: path.basename(filePath),
        size: stats.size,
        modified: stats.mtime,
        isReadable: await this.helpers.isFileReadable(filePath)
      }
    }]
  } catch (error) {
    throw new Error(`File validation failed: ${error.message}`)
  }
}
```

## Security Considerations

### Path Traversal Protection

```typescript
export async function execute(this: IExecuteFunctions) {
  const userPath = this.getNodeParameter('path', 0) as string
  
  // Validate and sanitize the path
  const safePath = await this.helpers.sanitizeFilePath(userPath)
  
  if (!safePath) {
    throw new Error('Invalid file path provided')
  }
  
  // Ensure path is within allowed directories
  if (!await this.helpers.isPathAllowed(safePath)) {
    throw new Error('Access to this path is not allowed')
  }
  
  return [{ json: { safePath } }]
}
```

### File Type Validation

```typescript
export async function execute(this: IExecuteFunctions) {
  const allowedExtensions = ['.txt', '.csv', '.json']
  const filePath = this.getNodeParameter('filePath', 0) as string
  
  const extension = path.extname(filePath).toLowerCase()
  
  if (!allowedExtensions.includes(extension)) {
    throw new Error(`File type ${extension} is not allowed`)
  }
  
  // Additional MIME type validation
  const mimeType = await this.helpers.getMimeType(filePath)
  const allowedMimeTypes = ['text/plain', 'text/csv', 'application/json']
  
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error(`MIME type ${mimeType} is not allowed`)
  }
  
  return [{ json: { filePath, mimeType } }]
}
```

## Best Practices

1. **Always use temporary files** for intermediate processing
2. **Validate file paths** to prevent security issues
3. **Check file sizes** before processing large files
4. **Handle errors gracefully** with meaningful messages
5. **Clean up resources** (though n8n handles this automatically for temp files)
6. **Use appropriate file permissions** when creating files
7. **Validate file types** before processing

## Error Handling

```typescript
export async function execute(this: IExecuteFunctions) {
  try {
    const filePath = this.getNodeParameter('filePath', 0) as string
    
    // Comprehensive file operation with error handling
    if (!await this.helpers.fileExists(filePath)) {
      throw new Error('File does not exist')
    }
    
    const content = await this.helpers.readTemporaryFile(filePath)
    
    return [{
      json: {
        success: true,
        content: content.toString()
      }
    }]
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('File not found')
    } else if (error.code === 'EACCES') {
      throw new Error('Permission denied')
    } else if (error.code === 'EISDIR') {
      throw new Error('Path is a directory, not a file')
    } else {
      throw new Error(`File operation failed: ${error.message}`)
    }
  }
}
```

## Related Documentation

- [Binary Data Helpers](./binary.md) - For handling binary file data
- [HTTP Helpers](./http.md) - For downloading files from URLs
- [IExecuteFunctions](../execution-contexts/IExecuteFunctions.md) - Main execution context
- [Error Handling](../../advanced/ErrorHandling.md) - Advanced error handling patterns
