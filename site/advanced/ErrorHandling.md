# Error Handling Patterns

Proper error handling is crucial for creating robust n8n nodes that provide clear feedback to users.

## Key Principles
- Use specific error types for different scenarios
- Provide actionable error messages
- Include context and suggestions for resolution
- Handle both API errors and validation errors

## Error Types
- `NodeApiError` - For API-related errors
- `NodeOperationError` - For operation/logic errors
- `NodeConnectionError` - For connection issues

## Complete Error Handling Examples

### Basic Error Handling with Try-Catch

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
  NodeOperationError,
  NodeConnectionError,
} from 'n8n-workflow';

export class ErrorHandlingExample implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Error Handling Example',
    name: 'errorHandlingExample',
    group: ['transform'],
    version: 1,
    description: 'Demonstrates comprehensive error handling patterns',
    defaults: {
      name: 'Error Handling Example',
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
            name: 'API Request',
            value: 'apiRequest',
            description: 'Make an API request with error handling',
          },
          {
            name: 'Data Validation',
            value: 'dataValidation',
            description: 'Validate input data with custom errors',
          },
          {
            name: 'File Processing',
            value: 'fileProcessing',
            description: 'Process files with comprehensive error handling',
          },
        ],
        default: 'apiRequest',
      },
      {
        displayName: 'API URL',
        name: 'apiUrl',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['apiRequest'],
          },
        },
        default: 'https://jsonplaceholder.typicode.com/posts/1',
        description: 'URL to make the API request to',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['dataValidation'],
          },
        },
        default: '',
        description: 'Email address to validate',
      },
      {
        displayName: 'File Path',
        name: 'filePath',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['fileProcessing'],
          },
        },
        default: '',
        description: 'Path to the file to process',
      },
      {
        displayName: 'Error Handling Options',
        name: 'errorOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Continue on Error',
            name: 'continueOnError',
            type: 'boolean',
            default: false,
            description: 'Continue processing other items if one fails',
          },
          {
            displayName: 'Retry Count',
            name: 'retryCount',
            type: 'number',
            default: 3,
            description: 'Number of times to retry failed operations',
          },
          {
            displayName: 'Retry Delay (ms)',
            name: 'retryDelay',
            type: 'number',
            default: 1000,
            description: 'Delay between retry attempts',
          },
          {
            displayName: 'Timeout (ms)',
            name: 'timeout',
            type: 'number',
            default: 30000,
            description: 'Request timeout in milliseconds',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;
    const errorOptions = this.getNodeParameter('errorOptions', 0, {}) as any;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: any;

        switch (operation) {
          case 'apiRequest':
            result = await this.handleApiRequest(i, errorOptions);
            break;
          case 'dataValidation':
            result = await this.handleDataValidation(i);
            break;
          case 'fileProcessing':
            result = await this.handleFileProcessing(i);
            break;
          default:
            throw new NodeOperationError(
              this.getNode(),
              `Unknown operation: ${operation}`,
              { itemIndex: i }
            );
        }

        returnData.push({ json: result });

      } catch (error) {
        // Handle errors based on configuration
        if (errorOptions.continueOnError) {
          // Add error information to output but continue processing
          returnData.push({
            json: {
              error: true,
              message: error.message,
              itemIndex: i,
              originalData: items[i].json,
            },
          });
          continue;
        } else {
          // Re-throw the error to stop execution
          throw error;
        }
      }
    }

    return [returnData];
  }

  private async handleApiRequest(itemIndex: number, errorOptions: any): Promise<any> {
    const apiUrl = this.getNodeParameter('apiUrl', itemIndex) as string;
    const retryCount = errorOptions.retryCount || 3;
    const retryDelay = errorOptions.retryDelay || 1000;
    const timeout = errorOptions.timeout || 30000;

    // Validate URL format
    try {
      new URL(apiUrl);
    } catch (error) {
      throw new NodeOperationError(
        this.getNode(),
        `Invalid URL format: ${apiUrl}`,
        {
          description: 'Please provide a valid HTTP or HTTPS URL',
          itemIndex,
        }
      );
    }

    let lastError: Error;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const response = await this.helpers.request({
          method: 'GET',
          url: apiUrl,
          timeout,
          json: true,
        });

        return {
          success: true,
          data: response,
          attempts: attempt,
          url: apiUrl,
        };

      } catch (error) {
        lastError = error;

        // Handle different types of errors
        if (error.code === 'ENOTFOUND') {
          throw new NodeConnectionError(
            this.getNode(),
            `Cannot resolve hostname: ${apiUrl}`,
            {
              description: 'Check if the URL is correct and the server is accessible',
              itemIndex,
            }
          );
        }

        if (error.code === 'ECONNREFUSED') {
          throw new NodeConnectionError(
            this.getNode(),
            `Connection refused to: ${apiUrl}`,
            {
              description: 'The server is not accepting connections on this port',
              itemIndex,
            }
          );
        }

        if (error.code === 'ETIMEDOUT') {
          if (attempt === retryCount) {
            throw new NodeApiError(
              this.getNode(),
              error,
              {
                message: `Request timed out after ${timeout}ms (${retryCount} attempts)`,
                description: 'Try increasing the timeout or check if the server is responding slowly',
                itemIndex,
              }
            );
          }
          // Continue to retry for timeout errors
        } else if (error.response?.status >= 400 && error.response?.status < 500) {
          // Client errors (4xx) - don't retry
          throw new NodeApiError(
            this.getNode(),
            error,
            {
              message: `API returned ${error.response.status}: ${error.response.statusText}`,
              description: this.getApiErrorDescription(error.response.status),
              itemIndex,
            }
          );
        } else if (error.response?.status >= 500) {
          // Server errors (5xx) - retry
          if (attempt === retryCount) {
            throw new NodeApiError(
              this.getNode(),
              error,
              {
                message: `Server error ${error.response.status} after ${retryCount} attempts`,
                description: 'The server is experiencing issues. Try again later.',
                itemIndex,
              }
            );
          }
        } else {
          // Unknown error - retry once then fail
          if (attempt === retryCount) {
            throw new NodeApiError(
              this.getNode(),
              error,
              {
                message: `Unexpected error: ${error.message}`,
                itemIndex,
              }
            );
          }
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retryCount) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // This should never be reached, but just in case
    throw lastError;
  }

  private async handleDataValidation(itemIndex: number): Promise<any> {
    const email = this.getNodeParameter('email', itemIndex) as string;

    // Validate email is provided
    if (!email || email.trim() === '') {
      throw new NodeOperationError(
        this.getNode(),
        'Email address is required',
        {
          description: 'Please provide a valid email address',
          itemIndex,
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new NodeOperationError(
        this.getNode(),
        `Invalid email format: ${email}`,
        {
          description: 'Please provide a valid email address (e.g., user@example.com)',
          itemIndex,
        }
      );
    }

    // Validate email domain (basic check)
    const domain = email.split('@')[1];
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const isCommonDomain = commonDomains.includes(domain.toLowerCase());

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /test@test\.com/i,
      /example@example\.com/i,
      /admin@admin\.com/i,
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(email));

    if (isSuspicious) {
      throw new NodeOperationError(
        this.getNode(),
        `Suspicious email pattern detected: ${email}`,
        {
          description: 'This appears to be a test or placeholder email address',
          itemIndex,
        }
      );
    }

    return {
      email,
      domain,
      isCommonDomain,
      validation: {
        format: 'valid',
        domain: 'checked',
        suspicious: false,
      },
    };
  }

  private async handleFileProcessing(itemIndex: number): Promise<any> {
    const filePath = this.getNodeParameter('filePath', itemIndex) as string;

    if (!filePath || filePath.trim() === '') {
      throw new NodeOperationError(
        this.getNode(),
        'File path is required',
        {
          description: 'Please provide a valid file path',
          itemIndex,
        }
      );
    }

    try {
      // Simulate file processing
      const fs = require('fs').promises;
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new NodeOperationError(
          this.getNode(),
          `File not found: ${filePath}`,
          {
            description: 'Please check that the file path is correct and the file exists',
            itemIndex,
          }
        );
      }

      // Get file stats
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        throw new NodeOperationError(
          this.getNode(),
          `Path is not a file: ${filePath}`,
          {
            description: 'Please provide a path to a file, not a directory',
            itemIndex,
          }
        );
      }

      // Check file size (limit to 10MB for this example)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSize) {
        throw new NodeOperationError(
          this.getNode(),
          `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB`,
          {
            description: `File size must be less than ${maxSize / 1024 / 1024}MB`,
            itemIndex,
          }
        );
      }

      // Read file content
      const content = await fs.readFile(filePath, 'utf8');

      return {
        filePath,
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
        modified: stats.mtime,
        contentLength: content.length,
        preview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      };

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NodeOperationError(
          this.getNode(),
          `File not found: ${filePath}`,
          {
            description: 'Please check that the file path is correct',
            itemIndex,
          }
        );
      } else if (error.code === 'EACCES') {
        throw new NodeOperationError(
          this.getNode(),
          `Permission denied: ${filePath}`,
          {
            description: 'Please check that you have permission to read this file',
            itemIndex,
          }
        );
      } else if (error.code === 'EISDIR') {
        throw new NodeOperationError(
          this.getNode(),
          `Path is a directory: ${filePath}`,
          {
            description: 'Please provide a path to a file, not a directory',
            itemIndex,
          }
        );
      } else {
        // Re-throw if it's already a Node error
        if (error.name === 'NodeOperationError') {
          throw error;
        }
        
        // Wrap unknown errors
        throw new NodeOperationError(
          this.getNode(),
          `File processing error: ${error.message}`,
          {
            description: 'An unexpected error occurred while processing the file',
            itemIndex,
          }
        );
      }
    }
  }

  private getApiErrorDescription(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Bad Request - Check your request parameters';
      case 401:
        return 'Unauthorized - Check your authentication credentials';
      case 403:
        return 'Forbidden - You do not have permission to access this resource';
      case 404:
        return 'Not Found - The requested resource does not exist';
      case 429:
        return 'Too Many Requests - You are being rate limited';
      case 500:
        return 'Internal Server Error - The server encountered an error';
      case 502:
        return 'Bad Gateway - The server received an invalid response';
      case 503:
        return 'Service Unavailable - The server is temporarily unavailable';
      case 504:
        return 'Gateway Timeout - The server did not respond in time';
      default:
        return 'An error occurred while making the API request';
    }
  }
}
```

### Advanced Error Handling with Custom Error Classes

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';

// Custom error classes for specific scenarios
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

class QuotaExceededError extends Error {
  constructor(
    message: string,
    public quotaType: string,
    public limit: number,
    public used: number,
    public resetDate?: Date
  ) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class AdvancedErrorHandling implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Advanced Error Handling',
    name: 'advancedErrorHandling',
    group: ['transform'],
    version: 1,
    description: 'Advanced error handling with custom error types and recovery strategies',
    defaults: {
      name: 'Advanced Error Handling',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        description: 'API key for authentication',
      },
      {
        displayName: 'User Data',
        name: 'userData',
        type: 'json',
        default: '{"name": "", "email": "", "age": 0}',
        description: 'User data to validate and process',
      },
      {
        displayName: 'Error Recovery',
        name: 'errorRecovery',
        type: 'collection',
        placeholder: 'Add Recovery Option',
        default: {},
        options: [
          {
            displayName: 'Auto Retry',
            name: 'autoRetry',
            type: 'boolean',
            default: true,
            description: 'Automatically retry failed requests',
          },
          {
            displayName: 'Fallback to Cache',
            name: 'fallbackToCache',
            type: 'boolean',
            default: false,
            description: 'Use cached data if API fails',
          },
          {
            displayName: 'Skip Invalid Items',
            name: 'skipInvalid',
            type: 'boolean',
            default: false,
            description: 'Skip items that fail validation',
          },
          {
            displayName: 'Partial Success Mode',
            name: 'partialSuccess',
            type: 'boolean',
            default: false,
            description: 'Return successful items even if some fail',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const errorRecovery = this.getNodeParameter('errorRecovery', 0, {}) as any;
    
    const errors: any[] = [];
    const successful: any[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await this.processItem(i);
        successful.push(result);
        returnData.push({ json: result });

      } catch (error) {
        const errorInfo = this.handleError(error, i, errorRecovery);
        
        if (errorInfo.recovered) {
          // Error was recovered, add the recovery result
          successful.push(errorInfo.result);
          returnData.push({ json: errorInfo.result });
        } else if (errorRecovery.partialSuccess) {
          // Track error but continue processing
          errors.push(errorInfo);
        } else {
          // Re-throw to stop execution
          throw errorInfo.nodeError;
        }
      }
    }

    // If we have errors but are in partial success mode, include error summary
    if (errors.length > 0 && errorRecovery.partialSuccess) {
      returnData.push({
        json: {
          summary: {
            successful: successful.length,
            failed: errors.length,
            total: items.length,
            errors: errors.map(e => ({
              itemIndex: e.itemIndex,
              type: e.type,
              message: e.message,
            })),
          },
        },
      });
    }

    return [returnData];
  }

  private async processItem(itemIndex: number): Promise<any> {
    const apiKey = this.getNodeParameter('apiKey', itemIndex) as string;
    const userDataStr = this.getNodeParameter('userData', itemIndex) as string;

    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      throw new ValidationError(
        'API key is required',
        'apiKey',
        apiKey,
        ['Obtain an API key from your service provider', 'Check your credential configuration']
      );
    }

    // Parse and validate user data
    let userData: any;
    try {
      userData = JSON.parse(userDataStr);
    } catch (error) {
      throw new ValidationError(
        'Invalid JSON in user data',
        'userData',
        userDataStr,
        ['Check JSON syntax', 'Use double quotes for strings', 'Ensure proper bracket matching']
      );
    }

    // Validate required fields
    this.validateUserData(userData);

    // Simulate API call with various error scenarios
    const result = await this.simulateApiCall(apiKey, userData);

    return {
      success: true,
      userData,
      apiResponse: result,
      processedAt: new Date().toISOString(),
    };
  }

  private validateUserData(userData: any): void {
    const errors: string[] = [];

    // Validate name
    if (!userData.name || typeof userData.name !== 'string' || userData.name.trim() === '') {
      throw new ValidationError(
        'Name is required and must be a non-empty string',
        'name',
        userData.name,
        ['Provide a valid name', 'Name must be at least 1 character long']
      );
    }

    if (userData.name.length > 100) {
      throw new ValidationError(
        'Name is too long (maximum 100 characters)',
        'name',
        userData.name,
        ['Shorten the name to 100 characters or less']
      );
    }

    // Validate email
    if (!userData.email || typeof userData.email !== 'string') {
      throw new ValidationError(
        'Email is required and must be a string',
        'email',
        userData.email,
        ['Provide a valid email address']
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new ValidationError(
        'Invalid email format',
        'email',
        userData.email,
        ['Use format: user@domain.com', 'Check for typos in email address']
      );
    }

    // Validate age
    if (userData.age !== undefined) {
      if (typeof userData.age !== 'number' || !Number.isInteger(userData.age)) {
        throw new ValidationError(
          'Age must be an integer',
          'age',
          userData.age,
          ['Provide age as a whole number', 'Remove decimal places']
        );
      }

      if (userData.age < 0 || userData.age > 150) {
        throw new ValidationError(
          'Age must be between 0 and 150',
          'age',
          userData.age,
          ['Provide a realistic age value']
        );
      }
    }
  }

  private async simulateApiCall(apiKey: string, userData: any): Promise<any> {
    // Simulate different error scenarios based on input
    const email = userData.email.toLowerCase();

    if (email.includes('ratelimit')) {
      throw new RateLimitError(
        'Rate limit exceeded',
        3600, // retry after 1 hour
        1000, // limit per hour
        0     // remaining requests
      );
    }

    if (email.includes('quota')) {
      throw new QuotaExceededError(
        'Monthly quota exceeded',
        'monthly_requests',
        10000,
        10000,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // reset in 30 days
      );
    }

    if (email.includes('server')) {
      const error = new Error('Internal server error');
      (error as any).response = { status: 500, statusText: 'Internal Server Error' };
      throw error;
    }

    if (email.includes('timeout')) {
      const error = new Error('Request timeout');
      (error as any).code = 'ETIMEDOUT';
      throw error;
    }

    if (email.includes('unauthorized')) {
      const error = new Error('Unauthorized');
      (error as any).response = { status: 401, statusText: 'Unauthorized' };
      throw error;
    }

    // Simulate successful response
    return {
      id: Math.floor(Math.random() * 10000),
      status: 'created',
      userData,
      timestamp: new Date().toISOString(),
    };
  }

  private handleError(error: Error, itemIndex: number, errorRecovery: any): any {
    // Handle custom error types
    if (error instanceof ValidationError) {
      const nodeError = new NodeOperationError(
        this.getNode(),
        `Validation failed for ${error.field}: ${error.message}`,
        {
          description: error.suggestions?.join('. ') || 'Please check your input data',
          itemIndex,
        }
      );

      if (errorRecovery.skipInvalid) {
        return {
          recovered: true,
          result: {
            error: true,
            type: 'validation',
            field: error.field,
            message: error.message,
            suggestions: error.suggestions,
            itemIndex,
          },
        };
      }

      return { recovered: false, nodeError, type: 'validation', message: error.message, itemIndex };
    }

    if (error instanceof RateLimitError) {
      const nodeError = new NodeApiError(
        this.getNode(),
        error,
        {
          message: `Rate limit exceeded. Retry after ${error.retryAfter} seconds`,
          description: `You have exceeded the rate limit of ${error.limit} requests. ${error.remaining} requests remaining.`,
          itemIndex,
        }
      );

      // Could implement automatic retry with delay here
      return { recovered: false, nodeError, type: 'rateLimit', message: error.message, itemIndex };
    }

    if (error instanceof QuotaExceededError) {
      const resetInfo = error.resetDate ? ` Quota resets on ${error.resetDate.toLocaleDateString()}` : '';
      const nodeError = new NodeApiError(
        this.getNode(),
        error,
        {
          message: `${error.quotaType} quota exceeded: ${error.used}/${error.limit}`,
          description: `You have exceeded your ${error.quotaType} quota.${resetInfo}`,
          itemIndex,
        }
      );

      return { recovered: false, nodeError, type: 'quota', message: error.message, itemIndex };
    }

    // Handle HTTP errors
    if ((error as any).response?.status) {
      const status = (error as any).response.status;
      
      if (status >= 500 && errorRecovery.fallbackToCache) {
        // Simulate cache fallback
        return {
          recovered: true,
          result: {
            fromCache: true,
            message: 'Server error - returned cached data',
            data: { id: 'cached', status: 'fallback' },
            itemIndex,
          },
        };
      }

      const nodeError = new NodeApiError(
        this.getNode(),
        error,
        {
          message: `HTTP ${status}: ${(error as any).response.statusText}`,
          description: this.getHttpErrorDescription(status),
          itemIndex,
        }
      );

      return { recovered: false, nodeError, type: 'http', message: error.message, itemIndex };
    }

    // Handle connection errors
    if ((error as any).code === 'ETIMEDOUT' && errorRecovery.autoRetry) {
      // Could implement retry logic here
      return {
        recovered: true,
        result: {
          error: true,
          type: 'timeout',
          message: 'Request timed out - skipped',
          itemIndex,
        },
      };
    }

    // Default error handling
    const nodeError = new NodeOperationError(
      this.getNode(),
      `Unexpected error: ${error.message}`,
      {
        description: 'An unexpected error occurred during processing',
        itemIndex,
      }
    );

    return { recovered: false, nodeError, type: 'unknown', message: error.message, itemIndex };
  }

  private getHttpErrorDescription(status: number): string {
    const descriptions: { [key: number]: string } = {
      400: 'Bad Request - Check your request parameters and data format',
      401: 'Unauthorized - Verify your API key and authentication',
      403: 'Forbidden - You do not have permission for this operation',
      404: 'Not Found - The requested resource does not exist',
      409: 'Conflict - The resource already exists or there is a conflict',
      422: 'Unprocessable Entity - Check your data format and required fields',
      429: 'Too Many Requests - You are being rate limited, try again later',
      500: 'Internal Server Error - The server encountered an error',
      502: 'Bad Gateway - The server received an invalid response',
      503: 'Service Unavailable - The server is temporarily unavailable',
      504: 'Gateway Timeout - The server did not respond in time',
    };

    return descriptions[status] || 'An HTTP error occurred';
  }
}
```

**Key Error Handling Patterns:**

1. **Specific Error Types:**
   - Use `NodeApiError` for API-related issues
   - Use `NodeOperationError` for logic/validation issues
   - Use `NodeConnectionError` for network problems

2. **Error Context:**
   - Always include `itemIndex` for batch processing
   - Provide actionable descriptions and suggestions
   - Include relevant error details (status codes, retry info)

3. **Recovery Strategies:**
   - Retry with exponential backoff
   - Fallback to cached data
   - Skip invalid items and continue
   - Partial success mode for batch operations

4. **Custom Error Classes:**
   - Create specific error types for domain-specific issues
   - Include relevant metadata (retry times, quotas, etc.)
   - Provide structured error information

5. **User-Friendly Messages:**
   - Clear, actionable error descriptions
   - Suggestions for resolution
   - Context about what went wrong and why

This comprehensive error handling approach ensures robust nodes that provide excellent user experience even when things go wrong!
