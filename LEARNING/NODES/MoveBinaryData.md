# MoveBinaryData Node - Implementation Patterns

## Key Learning Points

### 1. Bidirectional Data Conversion
```typescript
{
  displayName: 'Mode',
  name: 'mode',
  type: 'options',
  options: [
    {
      name: 'Binary to JSON',
      value: 'binaryToJson',
      description: 'Move data from Binary to JSON',
    },
    {
      name: 'JSON to Binary',
      value: 'jsonToBinary',
      description: 'Move data from JSON to Binary',
    },
  ],
  default: 'binaryToJson',
}
```
- Single node handles both conversion directions
- Clear mode descriptions for user understanding
- Bidirectional functionality in one implementation

### 2. Dynamic Encoding Options
```typescript
const bomAware: string[] = [];
const encodeDecodeOptions: INodePropertyOptions[] = [];
const encodings = (iconv as any).encodings;

Object.keys(encodings as IDataObject).forEach((encoding) => {
  if (!(encoding.startsWith('_') || typeof encodings[encoding] === 'string')) {
    if (encodings[encoding].bomAware) {
      bomAware.push(encoding);
    }
    encodeDecodeOptions.push({ name: encoding, value: encoding });
  }
});

encodeDecodeOptions.sort((a, b) => a.name.localeCompare(b.name));
```
- Dynamic option generation from iconv library
- BOM-aware encoding detection
- Sorted options for better UX

### 3. Conditional Field Display
```typescript
{
  displayName: 'Set All Data',
  name: 'setAllData',
  type: 'boolean',
  displayOptions: { show: { mode: ['binaryToJson'] } },
  default: true,
},
{
  displayName: 'Destination Key',
  name: 'destinationKey',
  displayOptions: {
    show: {
      mode: ['binaryToJson'],
      setAllData: [false],
    },
  },
}
```
- Mode-specific field visibility
- Nested conditional display logic
- Progressive disclosure based on user choices

### 4. Deep Key Path Support
```typescript
{
  displayName: 'Source Key',
  name: 'sourceKey',
  type: 'string',
  placeholder: 'data',
  description: 'The name of the binary key to get data from. It is also possible to define deep keys by using dot-notation like for example: "level1.level2.currentKey".',
}

// Usage in execution
const value = get(item.binary, sourceKey);
set(newItem.json, destinationKey, convertedValue);
unset(newItem.binary, sourceKey);
```
- Lodash get/set/unset for deep object manipulation
- Dot-notation support for nested properties
- Clear documentation of deep key capabilities

### 5. Binary Data Buffer Handling
```typescript
const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, sourceKey);

let convertedValue: string;
if (options.keepAsBase64 !== true) {
  convertedValue = iconv.decode(buffer, encoding, {
    stripBOM: options.stripBOM as boolean,
  });
} else {
  convertedValue = Buffer.from(buffer).toString(BINARY_ENCODING);
}
```
- Proper binary buffer retrieval
- Encoding-aware conversion
- Base64 preservation option

### 6. Data Preparation for Binary
```typescript
let data: Buffer;
if (options.dataIsBase64 !== true) {
  if (options.useRawData !== true || typeof value === 'object') {
    value = JSON.stringify(value);
    if (!mimeType) {
      mimeType = 'application/json';
    }
  }
  data = iconv.encode(value, encoding, { addBOM: options.addBOM as boolean });
} else {
  data = Buffer.from(value as unknown as string, BINARY_ENCODING);
}

const convertedValue = await this.helpers.prepareBinaryData(
  data,
  options.fileName as string,
  mimeType,
);
```
- Multiple data input formats
- Automatic MIME type detection
- BOM handling for text encodings

### 7. Source Data Preservation
```typescript
if (options.keepSource === true) {
  // Binary data does not get touched so simply reference it
  newItem.binary = item.binary;
} else {
  // Binary data will change so copy it
  newItem.binary = deepCopy(item.binary);
  unset(newItem.binary, sourceKey);
}
```
- Optional source data preservation
- Deep copying when modifying data
- Reference sharing when data unchanged

### 8. Version-Specific Behavior
```typescript
const nodeVersion = this.getNode().typeVersion;

if (!mimeType && nodeVersion === 1) {
  mimeType = 'application/json';
}

if (!convertedValue.fileName && nodeVersion > 1) {
  const fileExtension = convertedValue.fileExtension
    ? `.${convertedValue.fileExtension}`
    : '';
  convertedValue.fileName = `file${fileExtension}`;
}
```
- Version-aware default behavior
- Backward compatibility maintenance
- Progressive enhancement in newer versions

### 9. Complex Options Collection
```typescript
{
  displayName: 'Options',
  name: 'options',
  type: 'collection',
  options: [
    {
      displayName: 'Add Byte Order Mark (BOM)',
      name: 'addBOM',
      displayOptions: {
        show: {
          '/mode': ['jsonToBinary'],
          encoding: bomAware,
        },
      },
      type: 'boolean',
      default: false,
    },
    // ... more options
  ],
}
```
- Grouped optional settings
- Context-sensitive option visibility
- Encoding-specific options (BOM)

### 10. Data Validation and Skipping
```typescript
const value = get(item.binary, sourceKey);
if (value === undefined) {
  // No data found so skip
  continue;
}

// Later in execution
if (value === undefined) {
  // No data found so skip
  continue;
}
```
- Graceful handling of missing data
- Item-level skipping for invalid data
- Continue processing other items

### 11. JSON Parsing Options
```typescript
{
  displayName: 'JSON Parse',
  name: 'jsonParse',
  type: 'boolean',
  displayOptions: {
    hide: { keepAsBase64: [true] },
    show: {
      '/mode': ['binaryToJson'],
      '/setAllData': [false],
    },
  },
  default: false,
}

// Usage
if (options.jsonParse) {
  convertedValue = jsonParse(convertedValue);
}
```
- Optional JSON parsing for string data
- Conditional option visibility
- Safe JSON parsing with error handling

### 12. Implementation Patterns
- **Bidirectional Conversion**: Single node handles both directions
- **Dynamic Options**: Generate options from external libraries
- **Deep Object Manipulation**: Support dot-notation for nested properties
- **Binary Buffer Handling**: Proper encoding/decoding with iconv
- **Data Preservation**: Optional source data keeping
- **Version Compatibility**: Maintain backward compatibility

### 13. Reusable Patterns
- Use dynamic option generation for external library features
- Implement bidirectional functionality in single nodes
- Support deep key paths with lodash get/set/unset
- Handle binary data with proper encoding awareness
- Provide data preservation options for non-destructive operations
- Use conditional field display for progressive disclosure
- Implement version-specific behavior for backward compatibility
- Handle missing data gracefully with item skipping
- Group related options in collections
- Support multiple input/output formats in single operation
