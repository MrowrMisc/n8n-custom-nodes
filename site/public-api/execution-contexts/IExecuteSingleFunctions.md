# IExecuteSingleFunctions

The execution context for nodes that process items one at a time. This interface is used when your node needs to handle each input item individually, typically for operations that don't benefit from batch processing.

## When to Use

Use `IExecuteSingleFunctions` when:
- Processing items individually is more efficient
- Each item requires different processing logic
- You need to handle errors per item
- The operation doesn't support batch processing

## Interface Definition

```ts
interface IExecuteSingleFunctions extends IExecuteFunctions {
  getInputData(): INodeExecutionData;
  // Inherits all methods from IExecuteFunctions
}
```

## Key Differences from IExecuteFunctions

| Feature         | IExecuteFunctions              | IExecuteSingleFunctions              |
| --------------- | ------------------------------ | ------------------------------------ |
| Input handling  | `getInputData()` returns array | `getInputData()` returns single item |
| Item processing | Loop through items             | Process current item                 |
| Return format   | Array of items                 | Single item or array                 |
| Use case        | Batch operations               | Individual item operations           |

## Core Methods

### getInputData()

Returns the current input item being processed.

```ts
getInputData(): INodeExecutionData
```

**Returns:** Single `INodeExecutionData` object containing:
- `json` - The JSON data
- `binary?` - Binary data if present
- `pairedItem?` - Reference to source item

## Implementation Example

```ts
import {
  IExecuteSingleFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class SingleProcessorNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Single Processor',
    name: 'singleProcessor',
    group: ['transform'],
    version: 1,
    description: 'Process items individually',
    defaults: {
      name: 'Single Processor',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Transform',
            value: 'transform',
          },
          {
            name: 'Validate',
            value: 'validate',
          },
        ],
        default: 'transform',
      },
    ],
  };

  async executeSingle(this: IExecuteSingleFunctions): Promise<INodeExecutionData> {
    const operation = this.getNodeParameter('operation', 0) as string;
    const item = this.getInputData();

    try {
      switch (operation) {
        case 'transform':
          return await this.transformItem(item);
        case 'validate':
          return await this.validateItem(item);
        default:
          throw new NodeOperationError(
            this.getNode(),
            `Unknown operation: ${operation}`
          );
      }
    } catch (error) {
      if (this.continueOnFail()) {
        return {
          json: { error: error.message },
          pairedItem: item.pairedItem,
        };
      }
      throw error;
    }
  }

  private async transformItem(item: INodeExecutionData): Promise<INodeExecutionData> {
    // Transform the item
    const transformedData = {
      ...item.json,
      processed: true,
      timestamp: new Date().toISOString(),
    };

    return {
      json: transformedData,
      binary: item.binary,
      pairedItem: item.pairedItem,
    };
  }

  private async validateItem(item: INodeExecutionData): Promise<INodeExecutionData> {
    // Validate the item
    const isValid = this.validateData(item.json);

    return {
      json: {
        ...item.json,
        isValid,
        validatedAt: new Date().toISOString(),
      },
      binary: item.binary,
      pairedItem: item.pairedItem,
    };
  }

  private validateData(data: any): boolean {
    // Custom validation logic
    return data && typeof data === 'object' && Object.keys(data).length > 0;
  }
}
```

## Common Patterns

### Error Handling Per Item

```ts
async executeSingle(this: IExecuteSingleFunctions): Promise<INodeExecutionData> {
  const item = this.getInputData();
  
  try {
    // Process the item
    const result = await this.processItem(item);
    return result;
  } catch (error) {
    if (this.continueOnFail()) {
      // Return error information but continue processing
      return {
        json: {
          error: error.message,
          originalData: item.json,
        },
        pairedItem: item.pairedItem,
      };
    }
    
    // Re-throw to stop execution
    throw new NodeOperationError(
      this.getNode(),
      `Failed to process item: ${error.message}`,
      { itemIndex: 0 }
    );
  }
}
```

### Conditional Processing

```ts
async executeSingle(this: IExecuteSingleFunctions): Promise<INodeExecutionData> {
  const item = this.getInputData();
  const condition = this.getNodeParameter('condition', 0) as string;
  
  // Check if item meets condition
  if (!this.meetsCondition(item.json, condition)) {
    // Return item unchanged
    return item;
  }
  
  // Process the item
  const processedData = await this.processItem(item.json);
  
  return {
    json: processedData,
    binary: item.binary,
    pairedItem: item.pairedItem,
  };
}
```

### Binary Data Handling

```ts
async executeSingle(this: IExecuteSingleFunctions): Promise<INodeExecutionData> {
  const item = this.getInputData();
  
  // Process binary data if present
  if (item.binary) {
    const processedBinary: IBinaryKeyData = {};
    
    for (const [key, binaryData] of Object.entries(item.binary)) {
      const buffer = await this.helpers.getBinaryDataBuffer(0, key);
      const processedBuffer = await this.processBinaryData(buffer);
      
      processedBinary[key] = await this.helpers.prepareBinaryData(
        processedBuffer,
        binaryData.fileName,
        binaryData.mimeType
      );
    }
    
    return {
      json: item.json,
      binary: processedBinary,
      pairedItem: item.pairedItem,
    };
  }
  
  return item;
}
```

## Performance Considerations

### When to Use Single vs Batch Processing

```ts
// ✅ Good for single processing
- API calls that don't support batch operations
- File processing where each file is different
- Complex transformations that vary per item
- Operations that need individual error handling

// ❌ Better with batch processing (IExecuteFunctions)
- Database operations that support batch inserts
- Simple transformations applied to all items
- Operations where order matters across items
- Aggregation operations
```

### Memory Management

```ts
async executeSingle(this: IExecuteSingleFunctions): Promise<INodeExecutionData> {
  const item = this.getInputData();
  
  // Process large data efficiently
  if (this.isLargeDataItem(item)) {
    // Stream processing for large items
    return await this.processLargeItem(item);
  }
  
  // Standard processing for normal items
  return await this.processNormalItem(item);
}

private isLargeDataItem(item: INodeExecutionData): boolean {
  const jsonSize = JSON.stringify(item.json).length;
  const binarySize = item.binary ? Object.keys(item.binary).length : 0;
  
  return jsonSize > 1000000 || binarySize > 0; // 1MB threshold
}
```

## Best Practices

### 1. Preserve Item Context

```ts
// ✅ Good - preserve pairedItem for traceability
return {
  json: processedData,
  binary: item.binary,
  pairedItem: item.pairedItem,
};

// ❌ Bad - lose item context
return {
  json: processedData,
};
```

### 2. Handle Missing Data Gracefully

```ts
async executeSingle(this: IExecuteSingleFunctions): Promise<INodeExecutionData> {
  const item = this.getInputData();
  
  // Validate required fields
  const requiredField = item.json.requiredField;
  if (!requiredField) {
    if (this.continueOnFail()) {
      return {
        json: {
          ...item.json,
          error: 'Missing required field',
        },
        pairedItem: item.pairedItem,
      };
    }
    throw new NodeOperationError(
      this.getNode(),
      'Required field is missing'
    );
  }
  
  // Process item
  return await this.processItem(item);
}
```

### 3. Use Type Safety

```ts
interface InputData {
  id: string;
  name: string;
  email?: string;
}

interface OutputData extends InputData {
  processed: boolean;
  timestamp: string;
}

async executeSingle(this: IExecuteSingleFunctions): Promise<INodeExecutionData> {
  const item = this.getInputData();
  const inputData = item.json as InputData;
  
  // Type-safe processing
  const outputData: OutputData = {
    ...inputData,
    processed: true,
    timestamp: new Date().toISOString(),
  };
  
  return {
    json: outputData,
    binary: item.binary,
    pairedItem: item.pairedItem,
  };
}
```

## Error Handling

### Graceful Degradation

```ts
async executeSingle(this: IExecuteSingleFunctions): Promise<INodeExecutionData> {
  const item = this.getInputData();
  
  try {
    // Primary processing
    return await this.primaryProcess(item);
  } catch (primaryError) {
    try {
      // Fallback processing
      return await this.fallbackProcess(item);
    } catch (fallbackError) {
      if (this.continueOnFail()) {
        return {
          json: {
            ...item.json,
            error: `Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`,
          },
          pairedItem: item.pairedItem,
        };
      }
      throw new NodeOperationError(
        this.getNode(),
        `All processing methods failed: ${primaryError.message}`
      );
    }
  }
}
```

## See Also

- **[IExecuteFunctions](./IExecuteFunctions)** - Batch processing context
- **[getNodeParameter](../parameters/getNodeParameter)** - Accessing node parameters
- **[Error Handling](../../advanced/ErrorHandling)** - Robust error management
- **[Binary Data](../../advanced/BinaryData)** - Working with files and binary data
