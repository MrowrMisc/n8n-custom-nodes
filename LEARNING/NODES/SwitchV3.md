# SwitchV3 Node - Implementation Patterns

## Key Learning Points

### 1. Dynamic Output Configuration
```typescript
const configuredOutputs = (parameters: INodeParameters) => {
  const mode = parameters.mode as string;

  if (mode === 'expression') {
    return Array.from({ length: parameters.numberOutputs as number }, (_, i) => ({
      type: 'main',
      displayName: i.toString(),
    }));
  } else {
    const rules = ((parameters.rules as IDataObject)?.values as IDataObject[]) ?? [];
    const ruleOutputs = rules.map((rule, index) => {
      return {
        type: 'main',
        displayName: rule.outputKey || index.toString(),
      };
    });
    if ((parameters.options as IDataObject)?.fallbackOutput === 'extra') {
      ruleOutputs.push({
        type: 'main',
        displayName: renameFallbackOutput || 'Fallback',
      });
    }
    return ruleOutputs;
  }
};

outputs: `={{(${configuredOutputs})($parameter)}}`,
```
- Calculates outputs dynamically based on configuration
- Different output logic for expression vs rules mode
- Custom output names and fallback outputs

### 2. Mode-Based UI Structure
```typescript
{
  displayName: 'Mode',
  name: 'mode',
  type: 'options',
  options: [
    {
      name: 'Rules',
      value: 'rules',
      description: 'Build a matching rule for each output',
    },
    {
      name: 'Expression',
      value: 'expression',
      description: 'Write an expression to return the output index',
    },
  ],
  default: 'rules',
}
```
- Two distinct operation modes with different UIs
- Clear descriptions for each mode
- Rules mode for visual configuration, expression for code

### 3. Expression Mode Configuration
```typescript
{
  displayName: 'Number of Outputs',
  name: 'numberOutputs',
  type: 'number',
  displayOptions: { show: { mode: ['expression'] } },
  default: 4,
},
{
  displayName: 'Output Index',
  name: 'output',
  type: 'number',
  validateType: 'number',
  hint: 'The index to route the item to, starts at 0',
  displayOptions: { show: { mode: ['expression'] } },
  default: '={{}}',
  description: 'The expression must return a number.',
}
```
- Simple numeric configuration for expression mode
- Expression-based output index calculation
- Clear hints about zero-based indexing

### 4. Rules Mode with Sortable Collection
```typescript
{
  displayName: 'Routing Rules',
  name: 'rules',
  type: 'fixedCollection',
  typeOptions: {
    multipleValues: true,
    sortable: true,  // Allows reordering rules
  },
  default: {
    values: [
      {
        conditions: {
          options: { caseSensitive: true, typeValidation: 'strict' },
          conditions: [
            {
              leftValue: '',
              rightValue: '',
              operator: { type: 'string', operation: 'equals' },
            },
          ],
          combinator: 'and',
        },
      },
    ],
  },
}
```
- Sortable rules for priority-based evaluation
- Complex default structure with filter conditions
- Pre-configured condition templates

### 5. Dynamic Load Options
```typescript
methods = {
  loadOptions: {
    async getFallbackOutputOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
      const rules = (this.getCurrentNodeParameter('rules.values') as INodeParameters[]) ?? [];

      const outputOptions: INodePropertyOptions[] = [
        { name: 'None (default)', value: 'none' },
        { name: 'Extra Output', value: 'extra' },
      ];

      for (const [index, rule] of rules.entries()) {
        outputOptions.push({
          name: `Output ${rule.outputKey || index}`,
          value: index,
          description: `Items will be sent to the same output as when matched rule ${index + 1}`,
        });
      }

      return outputOptions;
    },
  },
};
```
- Dynamic options based on current configuration
- References existing rules for fallback options
- Descriptive option names and descriptions

### 6. Index Range Validation
```typescript
const checkIndexRange = (returnDataLength: number, index: number, itemIndex = 0) => {
  if (Number(index) === returnDataLength) {
    throw new NodeOperationError(this.getNode(), `The ouput ${index} is not allowed. `, {
      itemIndex,
      description: `Output indexes are zero based, if you want to use the extra output use ${
        index - 1
      }`,
    });
  }
  if (index < 0 || index > returnDataLength) {
    throw new NodeOperationError(this.getNode(), `The ouput ${index} is not allowed`, {
      itemIndex,
      description: `It has to be between 0 and ${returnDataLength - 1}`,
    });
    }
};
```
- Validates output indices before routing
- Provides helpful error messages with suggestions
- Handles edge cases like extra output confusion

### 7. Multi-Mode Execution Logic
```typescript
if (mode === 'expression') {
  const numberOutputs = this.getNodeParameter('numberOutputs', itemIndex) as number;
  if (itemIndex === 0) {
    returnData = new Array(numberOutputs).fill(0).map(() => []);
  }
  const outputIndex = this.getNodeParameter('output', itemIndex) as number;
  checkIndexRange(returnData.length, outputIndex, itemIndex);
  returnData[outputIndex].push(item);
} else if (mode === 'rules') {
  // Rules processing logic
}
```
- Different execution paths for each mode
- Lazy initialization of return data arrays
- Per-item parameter evaluation

### 8. Rules Processing with Early Exit
```typescript
let matchFound = false;
for (const [ruleIndex, rule] of rules.entries()) {
  let conditionPass = this.getNodeParameter(
    `rules.values[${ruleIndex}].conditions`,
    itemIndex,
    false,
    { extractValue: true },
  ) as boolean;

  if (conditionPass) {
    matchFound = true;
    returnData[ruleIndex].push(item);

    if (!options.allMatchingOutputs) {
      continue itemLoop;  // Early exit for first match
    }
  }
}
```
- Evaluates rules in order
- Early exit optimization for first match
- Optional "all matching outputs" mode

### 9. Fallback Output Handling
```typescript
if (fallbackOutput !== undefined && fallbackOutput !== 'none' && !matchFound) {
  if (fallbackOutput === 'extra') {
    returnData[returnData.length - 1].push(item);
    continue;
  }
  checkIndexRange(returnData.length, fallbackOutput as number, itemIndex);
  returnData[fallbackOutput as number].push(item);
}
```
- Multiple fallback strategies
- Extra output for unmatched items
- Route to existing outputs as fallback

### 10. Custom Output Names
```typescript
{
  displayName: 'Rename Output',
  name: 'renameOutput',
  type: 'boolean',
  default: false,
},
{
  displayName: 'Output Name',
  name: 'outputKey',
  type: 'string',
  default: '',
  displayOptions: { show: { renameOutput: [true] } },
}
```
- Optional custom output naming
- Conditional display for output name field
- Improves workflow readability

### 11. Implementation Patterns
- **Dynamic Outputs**: Calculate outputs based on configuration
- **Mode-Based UI**: Different interfaces for different use cases
- **Sortable Rules**: Priority-based rule evaluation
- **Load Options**: Dynamic option generation from current state
- **Index Validation**: Prevent routing errors with helpful messages
- **Early Exit**: Optimize performance with continue statements

### 12. Reusable Patterns
- Use dynamic output calculation for flexible routing nodes
- Implement mode-based UI for different user preferences
- Add sortable collections for priority-based configurations
- Provide dynamic load options based on current parameters
- Validate indices with helpful error messages
- Support both first-match and all-match routing strategies
- Implement fallback strategies for unmatched items
- Allow custom output naming for better workflow documentation
- Use early exit patterns for performance optimization
- Handle multiple execution modes in single node
