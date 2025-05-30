# IfV2 Node - Implementation Patterns

## Key Learning Points

### 1. Versioned Node Architecture
```typescript
export class If extends VersionedNodeType {
  constructor() {
    const baseDescription: INodeTypeBaseDescription = {
      displayName: 'If',
      name: 'if',
      defaultVersion: 2.2,
    };

    const nodeVersions: IVersionedNodeType['nodeVersions'] = {
      1: new IfV1(baseDescription),
      2: new IfV2(baseDescription),
      2.1: new IfV2(baseDescription),
      2.2: new IfV2(baseDescription),
    };

    super(nodeVersions, baseDescription);
  }
}
```
- Uses `VersionedNodeType` for managing multiple versions
- Maps version numbers to specific implementations
- Shares base description across versions

### 2. Multiple Outputs
```typescript
outputs: [NodeConnectionTypes.Main, NodeConnectionTypes.Main],
outputNames: ['true', 'false'],
```
- Defines two output connections
- Names outputs for clarity in UI
- Routes items based on condition evaluation

### 3. Filter Type Parameter
```typescript
{
  displayName: 'Conditions',
  name: 'conditions',
  type: 'filter',
  typeOptions: {
    filter: {
      caseSensitive: '={{!$parameter.options.ignoreCase}}',
      typeValidation: getTypeValidationStrictness(2.1),
      version: '={{ $nodeVersion >= 2.2 ? 2 : 1 }}',
    },
  },
}
```
- Uses `type: 'filter'` for complex condition building
- Dynamic configuration based on other parameters
- Version-specific filter behavior

### 4. Wide Parameter Pane
```typescript
parameterPane: 'wide',
```
- Uses wider parameter pane for complex filter UI
- Better UX for condition building

### 5. Item Processing with Routing
```typescript
const trueItems: INodeExecutionData[] = [];
const falseItems: INodeExecutionData[] = [];

this.getInputData().forEach((item, itemIndex) => {
  const pass = this.getNodeParameter('conditions', itemIndex, false, {
    extractValue: true,
  }) as boolean;

  if (pass) {
    trueItems.push(item);
  } else {
    falseItems.push(item);
  }
});

return [trueItems, falseItems];
```
- Evaluates conditions per item
- Routes items to appropriate output arrays
- Returns multiple output arrays

### 6. Paired Item Tracking
```typescript
if (item.pairedItem === undefined) {
  item.pairedItem = { item: itemIndex };
}
```
- Maintains item lineage for debugging
- Links output items back to input items

### 7. Type Validation Handling
```typescript
try {
  pass = this.getNodeParameter('conditions', itemIndex, false, {
    extractValue: true,
  }) as boolean;
} catch (error) {
  if (
    !getTypeValidationParameter(2.1)(this, itemIndex, options.looseTypeValidation) &&
    !error.description
  ) {
    set(error, 'description', ENABLE_LESS_STRICT_TYPE_VALIDATION);
  }
  set(error, 'context.itemIndex', itemIndex);
  throw error;
}
```
- Handles type validation errors gracefully
- Provides helpful error messages
- Adds context information to errors

### 8. Version-Specific Features
```typescript
{
  ...looseTypeValidationProperty,
  displayOptions: {
    show: {
      '@version': [{ _cnd: { gte: 2.1 } }],
    },
  },
}
```
- Shows features only in specific versions
- Uses conditional display with version comparisons

### 9. Error Context Enhancement
```typescript
set(error, 'context.itemIndex', itemIndex);
set(error, 'node', this.getNode());
```
- Uses lodash `set` to add error context
- Provides debugging information for failures

### 10. Continue on Fail Logic
```typescript
if (this.continueOnFail()) {
  falseItems.push(item);
} else {
  throw new NodeOperationError(this.getNode(), error, { itemIndex });
}
```
- Routes failed items to false output when continuing on fail
- Maintains workflow execution despite errors

### 11. Implementation Patterns
- **Multiple Outputs**: Return array of arrays for routing
- **Item-Level Processing**: Evaluate conditions per item
- **Error Context**: Add debugging information to errors
- **Version Management**: Use versioned node architecture
- **Type Safety**: Handle type validation gracefully

### 12. Reusable Patterns
- Use `VersionedNodeType` for complex version management
- Define multiple outputs with descriptive names
- Process items individually for routing logic
- Maintain paired item relationships
- Handle type validation errors with helpful messages
- Use `parameterPane: 'wide'` for complex UIs
- Route failed items appropriately in continue-on-fail mode
