# SetV2 Node - Implementation Patterns

## Key Learning Points

### 1. Versioned Node Structure
- Uses constructor pattern with `INodeTypeBaseDescription`
- Merges base description with version-specific description
- Supports multiple versions: `[3, 3.1, 3.2, 3.3, 3.4]`

### 2. Modular Architecture
```typescript
import * as manual from './manual.mode';
import * as raw from './raw.mode';

const setNode = { raw, manual };
```
- Separates execution logic into mode-specific modules
- Clean separation of concerns for different operation modes

### 3. Version-Specific UI Logic
```typescript
displayOptions: {
  show: {
    '@version': [3, 3.1, 3.2],
  },
},
// vs
displayOptions: {
  hide: {
    '@version': [3, 3.1, 3.2],
  },
}
```
- Shows/hides fields based on node version
- Allows UI evolution while maintaining backward compatibility

### 4. Complex Display Options
```typescript
displayOptions: {
  show: {
    include: ['selected'],
    '/includeOtherFields': [true],
  },
  hide: {
    '@version': [3, 3.1, 3.2],
  },
}
```
- Multiple conditions with show/hide logic
- Path references with `/` for nested parameters

### 5. Node Settings vs Parameters
```typescript
{
  displayName: 'Duplicate Item',
  name: 'duplicateItem',
  type: 'boolean',
  default: false,
  isNodeSetting: true,  // Special flag for node settings
}
```
- `isNodeSetting: true` marks development/testing features

### 6. Raw Expression Handling
```typescript
const jsonOutput = this.getNodeParameter('jsonOutput', 0, '', {
  rawExpressions: true,
}) as string | undefined;

if (jsonOutput?.startsWith('=')) {
  rawData.jsonOutput = jsonOutput.replace(/^=+/, '');
}
```
- Handles n8n expressions that start with `=`
- Processes raw expressions for dynamic content

### 7. Execution Delegation Pattern
```typescript
const newItem = await setNode[mode].execute.call(
  this,
  items[i],
  i,
  options as SetNodeOptions,
  rawData,
  node,
);
```
- Delegates execution to mode-specific handlers
- Passes execution context with `.call(this, ...)`

### 8. Development Features
```typescript
if (duplicateItem && this.getMode() === 'manual') {
  const duplicateCount = this.getNodeParameter('duplicateCount', 0, 0) as number;
  for (let j = 0; j <= duplicateCount; j++) {
    returnData.push(newItem);
  }
}
```
- Special behavior for manual execution mode
- Testing/debugging features that don't affect production

### 9. Implementation Patterns
- **Modular Design**: Separate execution logic by operation mode
- **Version Management**: Use display options for version-specific UI
- **Settings vs Parameters**: Distinguish development features
- **Expression Processing**: Handle dynamic expressions properly
- **Context Delegation**: Pass execution context to sub-modules

### 10. Reusable Patterns
- Use constructor pattern for versioned nodes
- Separate complex logic into mode-specific modules
- Use `@version` in display options for UI evolution
- Mark development features with `isNodeSetting`
- Process raw expressions by checking for `=` prefix
- Delegate execution while preserving context with `.call()`
