# n8n Node Development Learning Guide

This repository contains comprehensive learning materials for developing n8n nodes and credentials, based on analysis of real n8n core implementations.

## Repository Structure

### 📁 CREDENTIALS/
Analysis of different credential types and authentication patterns:

- **[HttpBasicAuth.md](CREDENTIALS/HttpBasicAuth.md)** - Simple credential with minimal structure
- **[OAuth2Api.md](CREDENTIALS/OAuth2Api.md)** - Advanced credential with conditional fields
- **[SlackOAuth2Api.md](CREDENTIALS/SlackOAuth2Api.md)** - Service-specific OAuth2 with inheritance
- **[GoogleApi.md](CREDENTIALS/GoogleApi.md)** - Complex credential with custom authentication
- **[HttpBearerAuth.md](CREDENTIALS/HttpBearerAuth.md)** - Generic authentication interface

### 📁 NODES/
Analysis of different node types and implementation patterns:

- **[SetV2.md](NODES/SetV2.md)** - Versioned node with modular architecture
- **[Webhook.md](NODES/Webhook.md)** - Trigger node with webhook handling
- **[Function.md](NODES/Function.md)** - Code execution node with VM sandboxing
- **[IfV2.md](NODES/IfV2.md)** - Conditional routing with multiple outputs

## Key Learning Areas

### 🔐 Credential Development

**Basic Patterns:**
- Simple field definitions with `INodeProperties[]`
- Password fields with `typeOptions: { password: true }`
- Generic auth with `genericAuth = true`

**Advanced Patterns:**
- Conditional field display with `displayOptions`
- Credential inheritance with `extends`
- Custom authentication methods
- External API integration

**Authentication Types:**
- **Generic Auth**: Use `IAuthenticateGeneric` for standard patterns
- **Custom Auth**: Implement `authenticate()` method for complex flows
- **OAuth2**: Extend base OAuth2 with service-specific configurations

### 🔧 Node Development

**Core Node Types:**
- **Regular Nodes**: Implement `INodeType` with `execute()` method
- **Trigger Nodes**: Extend `Node` class with `webhook()` method
- **Versioned Nodes**: Use `VersionedNodeType` for version management

**UI Patterns:**
- **Conditional Display**: Use `displayOptions` with show/hide logic
- **Version-Specific UI**: Use `@version` conditions
- **Complex Forms**: Use `parameterPane: 'wide'` for better UX
- **Code Editors**: Configure with appropriate `typeOptions`

**Data Processing:**
- **Item Processing**: Handle arrays of `INodeExecutionData`
- **Multiple Outputs**: Return arrays of arrays for routing
- **Binary Data**: Use helpers for file processing
- **Error Handling**: Provide context and helpful messages

### 🏗️ Architecture Patterns

**Modular Design:**
- Separate execution logic by operation mode
- Use utility functions for common operations
- Delegate complex logic to specialized modules

**Version Management:**
- Use constructor patterns for versioned nodes
- Handle backward compatibility with display options
- Migrate features gracefully across versions

**Security:**
- Implement proper sandboxing for code execution
- Validate user input thoroughly
- Handle authentication securely

## Development Workflow

### 1. Planning
- Identify the type of node/credential needed
- Choose appropriate base patterns from examples
- Plan UI structure and user experience

### 2. Implementation
- Start with basic structure from relevant examples
- Implement core functionality incrementally
- Add error handling and validation

### 3. Testing
- Test with various input scenarios
- Verify error handling and edge cases
- Test version compatibility if applicable

### 4. Documentation
- Document parameters and usage
- Provide helpful descriptions and examples
- Include troubleshooting guidance

## Best Practices

### Code Quality
- Use strong TypeScript typing throughout
- Follow n8n naming conventions
- Implement proper error handling
- Add helpful user guidance

### User Experience
- Provide clear parameter descriptions
- Use appropriate input types and validation
- Add notices for important information
- Handle edge cases gracefully

### Security
- Validate all user inputs
- Use secure authentication patterns
- Implement proper sandboxing where needed
- Handle sensitive data appropriately

### Performance
- Process data efficiently
- Use streaming for large files
- Implement proper cleanup
- Avoid memory leaks

## Common Patterns Reference

### Credential Patterns
```typescript
// Basic credential
export class MyCredential implements ICredentialType {
  name = 'myCredential';
  displayName = 'My Service';
  properties: INodeProperties[] = [/* fields */];
}

// OAuth2 credential
export class MyOAuth2 implements ICredentialType {
  extends = ['oAuth2Api'];
  // Override specific fields
}

// Custom auth credential
export class MyCustomAuth implements ICredentialType {
  async authenticate(credentials, requestOptions) {
    // Custom auth logic
    return modifiedRequestOptions;
  }
}
```

### Node Patterns
```typescript
// Regular node
export class MyNode implements INodeType {
  description: INodeTypeDescription = {/* config */};
  async execute(this: IExecuteFunctions) {
    // Process items
    return [outputItems];
  }
}

// Trigger node
export class MyTrigger extends Node {
  async webhook(context: IWebhookFunctions) {
    // Handle webhook
    return { workflowData: [[items]] };
  }
}

// Versioned node
export class MyVersionedNode extends VersionedNodeType {
  constructor() {
    const nodeVersions = {
      1: new MyNodeV1(baseDescription),
      2: new MyNodeV2(baseDescription),
    };
    super(nodeVersions, baseDescription);
  }
}
```

## Next Steps

1. **Choose Your Pattern**: Select the most appropriate examples for your use case
2. **Start Simple**: Begin with basic functionality and iterate
3. **Test Thoroughly**: Verify behavior across different scenarios
4. **Follow Examples**: Use the documented patterns as templates
5. **Contribute Back**: Share learnings and improvements with the community

---

*This guide is based on analysis of n8n core nodes and credentials. Patterns may evolve as n8n develops, so always refer to the latest n8n documentation and source code for the most current practices.*
