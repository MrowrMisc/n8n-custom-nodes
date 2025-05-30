# Tool Metadata for AI

Adding metadata to n8n nodes enables AI systems to understand and use your nodes more effectively.

## Key Concepts
- Tool metadata describes what your node does and how to use it
- Includes parameters, examples, and usage patterns
- Helps AI systems generate correct workflows
- Improves discoverability and usability

## Metadata Structure
```ts
interface IToolMetadata {
  name: string;
  description: string;
  parameters: IToolParameter[];
  examples?: IToolExample[];
  categories?: string[];
  tags?: string[];
  useCases?: string[];
}
```

## Complete Tool Metadata Examples

### AI-Optimized Node with Rich Metadata

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class AIOptimizedNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'AI Data Processor',
    name: 'aiDataProcessor',
    icon: 'fa:robot',
    group: ['transform'],
    version: 1,
    description: 'Process and analyze data using AI-friendly operations',
    defaults: {
      name: 'AI Data Processor',
    },
    inputs: ['main'],
    outputs: ['main'],
    
    // AI Tool Metadata
    codex: {
      categories: ['Data Processing', 'AI/ML', 'Analytics'],
      subcategories: ['Text Analysis', 'Data Transformation', 'Pattern Recognition'],
      resources: {
        primaryDocumentation: [
          {
            url: 'https://docs.n8n.io/nodes/ai-data-processor',
            description: 'Complete guide to AI data processing',
          },
        ],
        generic: [
          {
            label: 'AI Processing Best Practices',
            icon: '🤖',
            url: 'https://docs.n8n.io/ai-best-practices',
          },
        ],
      },
      alias: ['ai processor', 'data analyzer', 'ml preprocessor'],
    },

    // Tool metadata for AI systems
    toolMetadata: {
      name: 'AI Data Processor',
      description: 'Processes and analyzes data using various AI-friendly operations including text analysis, data cleaning, pattern recognition, and statistical analysis',
      parameters: [
        {
          name: 'operation',
          type: 'string',
          description: 'The type of processing operation to perform',
          required: true,
          enum: ['analyze_text', 'clean_data', 'extract_patterns', 'calculate_stats', 'classify_content'],
          examples: ['analyze_text', 'clean_data'],
        },
        {
          name: 'input_data',
          type: 'string|object|array',
          description: 'The data to process - can be text, JSON object, or array of items',
          required: true,
          examples: [
            'This is sample text to analyze',
            '{"name": "John", "age": 30}',
            '[{"id": 1, "value": "data1"}, {"id": 2, "value": "data2"}]',
          ],
        },
        {
          name: 'analysis_options',
          type: 'object',
          description: 'Configuration options for the analysis',
          required: false,
          properties: {
            language: {
              type: 'string',
              description: 'Language for text analysis',
              default: 'en',
              examples: ['en', 'es', 'fr', 'de'],
            },
            confidence_threshold: {
              type: 'number',
              description: 'Minimum confidence level for results (0-1)',
              default: 0.7,
              examples: [0.8, 0.9],
            },
            include_metadata: {
              type: 'boolean',
              description: 'Whether to include processing metadata in results',
              default: true,
            },
          },
        },
      ],
      examples: [
        {
          name: 'Analyze customer feedback',
          description: 'Extract sentiment and key topics from customer reviews',
          input: {
            operation: 'analyze_text',
            input_data: 'The product is amazing! Great quality and fast shipping.',
            analysis_options: {
              language: 'en',
              confidence_threshold: 0.8,
              include_metadata: true,
            },
          },
          output: {
            sentiment: 'positive',
            confidence: 0.95,
            topics: ['product quality', 'shipping'],
            metadata: {
              word_count: 9,
              processing_time: '0.2s',
            },
          },
        },
        {
          name: 'Clean messy data',
          description: 'Remove duplicates and standardize format',
          input: {
            operation: 'clean_data',
            input_data: [
              { name: 'John Doe', email: 'john@example.com' },
              { name: 'john doe', email: 'john@example.com' },
              { name: 'Jane Smith', email: 'jane@test.com' },
            ],
          },
          output: {
            cleaned_data: [
              { name: 'John Doe', email: 'john@example.com' },
              { name: 'Jane Smith', email: 'jane@test.com' },
            ],
            removed_duplicates: 1,
            standardized_fields: ['name'],
          },
        },
      ],
      useCases: [
        'Sentiment analysis of customer feedback',
        'Data cleaning and deduplication',
        'Content classification and tagging',
        'Pattern recognition in datasets',
        'Statistical analysis and reporting',
        'Text preprocessing for ML models',
        'Data quality assessment',
      ],
      tags: ['ai', 'ml', 'data-processing', 'analytics', 'nlp', 'text-analysis'],
    },

    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Analyze Text',
            value: 'analyze_text',
            description: 'Perform sentiment analysis and extract key information from text',
            action: 'Analyze text content',
          },
          {
            name: 'Clean Data',
            value: 'clean_data',
            description: 'Remove duplicates, standardize formats, and clean messy data',
            action: 'Clean and standardize data',
          },
          {
            name: 'Extract Patterns',
            value: 'extract_patterns',
            description: 'Identify patterns and anomalies in datasets',
            action: 'Extract data patterns',
          },
          {
            name: 'Calculate Statistics',
            value: 'calculate_stats',
            description: 'Generate statistical summaries and insights',
            action: 'Calculate statistical metrics',
          },
          {
            name: 'Classify Content',
            value: 'classify_content',
            description: 'Categorize and tag content automatically',
            action: 'Classify and categorize content',
          },
        ],
        default: 'analyze_text',
        description: 'The type of AI processing operation to perform',
      },
      {
        displayName: 'Input Data',
        name: 'inputData',
        type: 'json',
        default: '{}',
        description: 'The data to process (text, JSON object, or array)',
        placeholder: '{"text": "Sample data to analyze"}',
      },
      {
        displayName: 'Analysis Options',
        name: 'analysisOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Language',
            name: 'language',
            type: 'options',
            options: [
              { name: 'English', value: 'en' },
              { name: 'Spanish', value: 'es' },
              { name: 'French', value: 'fr' },
              { name: 'German', value: 'de' },
              { name: 'Auto-detect', value: 'auto' },
            ],
            default: 'en',
            description: 'Language for text analysis',
          },
          {
            displayName: 'Confidence Threshold',
            name: 'confidenceThreshold',
            type: 'number',
            typeOptions: {
              minValue: 0,
              maxValue: 1,
              numberStepSize: 0.1,
            },
            default: 0.7,
            description: 'Minimum confidence level for results (0-1)',
          },
          {
            displayName: 'Include Metadata',
            name: 'includeMetadata',
            type: 'boolean',
            default: true,
            description: 'Include processing metadata in results',
          },
          {
            displayName: 'Max Results',
            name: 'maxResults',
            type: 'number',
            default: 100,
            description: 'Maximum number of results to return',
          },
        ],
      },
      {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        options: [
          { name: 'Detailed', value: 'detailed' },
          { name: 'Summary', value: 'summary' },
          { name: 'Raw', value: 'raw' },
        ],
        default: 'detailed',
        description: 'Format for the output results',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        const inputDataStr = this.getNodeParameter('inputData', i) as string;
        const analysisOptions = this.getNodeParameter('analysisOptions', i, {}) as any;
        const outputFormat = this.getNodeParameter('outputFormat', i) as string;

        // Parse input data
        let inputData: any;
        try {
          inputData = JSON.parse(inputDataStr);
        } catch (error) {
          // If not valid JSON, treat as plain text
          inputData = inputDataStr;
        }

        let result: any;

        switch (operation) {
          case 'analyze_text':
            result = await this.analyzeText(inputData, analysisOptions);
            break;
          case 'clean_data':
            result = await this.cleanData(inputData, analysisOptions);
            break;
          case 'extract_patterns':
            result = await this.extractPatterns(inputData, analysisOptions);
            break;
          case 'calculate_stats':
            result = await this.calculateStats(inputData, analysisOptions);
            break;
          case 'classify_content':
            result = await this.classifyContent(inputData, analysisOptions);
            break;
          default:
            throw new NodeOperationError(
              this.getNode(),
              `Unknown operation: ${operation}`,
              { itemIndex: i }
            );
        }

        // Format output based on user preference
        const formattedResult = this.formatOutput(result, outputFormat);

        returnData.push({
          json: {
            operation,
            success: true,
            ...formattedResult,
            metadata: {
              processed_at: new Date().toISOString(),
              item_index: i,
              processing_options: analysisOptions,
            },
          },
        });

      } catch (error) {
        throw new NodeOperationError(
          this.getNode(),
          `Processing failed: ${error.message}`,
          { itemIndex: i }
        );
      }
    }

    return [returnData];
  }

  private async analyzeText(inputData: any, options: any): Promise<any> {
    const text = typeof inputData === 'string' ? inputData : inputData.text || JSON.stringify(inputData);
    const language = options.language || 'en';
    const confidenceThreshold = options.confidenceThreshold || 0.7;

    // Simulate text analysis
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Simple sentiment analysis simulation
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];

    const positiveCount = words.filter(word => 
      positiveWords.some(pos => word.toLowerCase().includes(pos))
    ).length;
    const negativeCount = words.filter(word => 
      negativeWords.some(neg => word.toLowerCase().includes(neg))
    ).length;

    let sentiment = 'neutral';
    let confidence = 0.5;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.95, 0.6 + (positiveCount / words.length) * 2);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.95, 0.6 + (negativeCount / words.length) * 2);
    }

    // Extract key topics (simplified)
    const topics = words
      .filter(word => word.length > 4)
      .reduce((acc: any, word) => {
        const key = word.toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    const topTopics = Object.entries(topics)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([topic]) => topic);

    return {
      sentiment,
      confidence,
      topics: topTopics,
      statistics: {
        word_count: words.length,
        sentence_count: sentences.length,
        avg_words_per_sentence: words.length / sentences.length,
        language_detected: language,
      },
      analysis_metadata: {
        confidence_threshold: confidenceThreshold,
        processing_time: '0.1s',
      },
    };
  }

  private async cleanData(inputData: any, options: any): Promise<any> {
    if (!Array.isArray(inputData)) {
      throw new NodeOperationError(
        this.getNode(),
        'Clean data operation requires an array of objects'
      );
    }

    const originalCount = inputData.length;
    let cleanedData = [...inputData];

    // Remove duplicates based on all fields
    const seen = new Set();
    cleanedData = cleanedData.filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    // Standardize string fields
    const standardizedFields: string[] = [];
    cleanedData = cleanedData.map(item => {
      const cleaned = { ...item };
      Object.keys(cleaned).forEach(key => {
        if (typeof cleaned[key] === 'string') {
          const original = cleaned[key];
          cleaned[key] = cleaned[key].trim();
          
          // Standardize name fields
          if (key.toLowerCase().includes('name')) {
            cleaned[key] = cleaned[key]
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            if (original !== cleaned[key] && !standardizedFields.includes(key)) {
              standardizedFields.push(key);
            }
          }
        }
      });
      return cleaned;
    });

    return {
      cleaned_data: cleanedData,
      statistics: {
        original_count: originalCount,
        cleaned_count: cleanedData.length,
        removed_duplicates: originalCount - cleanedData.length,
        standardized_fields: standardizedFields,
      },
    };
  }

  private async extractPatterns(inputData: any, options: any): Promise<any> {
    if (!Array.isArray(inputData)) {
      throw new NodeOperationError(
        this.getNode(),
        'Pattern extraction requires an array of data'
      );
    }

    // Analyze data structure patterns
    const fieldTypes: { [key: string]: { [type: string]: number } } = {};
    const fieldValues: { [key: string]: any[] } = {};

    inputData.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (!fieldTypes[key]) {
          fieldTypes[key] = {};
          fieldValues[key] = [];
        }

        const type = typeof value;
        fieldTypes[key][type] = (fieldTypes[key][type] || 0) + 1;
        fieldValues[key].push(value);
      });
    });

    // Detect patterns
    const patterns: any[] = [];

    Object.entries(fieldValues).forEach(([field, values]) => {
      const uniqueValues = [...new Set(values)];
      const uniqueRatio = uniqueValues.length / values.length;

      if (uniqueRatio < 0.1) {
        patterns.push({
          type: 'low_cardinality',
          field,
          description: `Field '${field}' has low cardinality (${uniqueValues.length} unique values)`,
          unique_values: uniqueValues.slice(0, 10),
        });
      }

      if (field.toLowerCase().includes('email')) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmails = values.filter(v => typeof v === 'string' && emailPattern.test(v));
        if (validEmails.length !== values.length) {
          patterns.push({
            type: 'data_quality_issue',
            field,
            description: `Field '${field}' contains invalid email addresses`,
            valid_count: validEmails.length,
            total_count: values.length,
          });
        }
      }
    });

    return {
      patterns,
      field_analysis: fieldTypes,
      data_summary: {
        total_records: inputData.length,
        total_fields: Object.keys(fieldTypes).length,
        patterns_found: patterns.length,
      },
    };
  }

  private async calculateStats(inputData: any, options: any): Promise<any> {
    if (!Array.isArray(inputData)) {
      throw new NodeOperationError(
        this.getNode(),
        'Statistical analysis requires an array of data'
      );
    }

    const numericFields: { [key: string]: number[] } = {};
    const textFields: { [key: string]: string[] } = {};

    // Separate numeric and text fields
    inputData.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (!numericFields[key]) numericFields[key] = [];
          numericFields[key].push(value);
        } else if (typeof value === 'string') {
          if (!textFields[key]) textFields[key] = [];
          textFields[key].push(value);
        }
      });
    });

    // Calculate statistics for numeric fields
    const numericStats: { [key: string]: any } = {};
    Object.entries(numericFields).forEach(([field, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;

      numericStats[field] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        mean: Math.round(mean * 100) / 100,
        median: sorted[Math.floor(sorted.length / 2)],
        std_dev: Math.round(Math.sqrt(variance) * 100) / 100,
        sum,
      };
    });

    // Calculate statistics for text fields
    const textStats: { [key: string]: any } = {};
    Object.entries(textFields).forEach(([field, values]) => {
      const lengths = values.map(v => v.length);
      const uniqueValues = [...new Set(values)];

      textStats[field] = {
        count: values.length,
        unique_count: uniqueValues.length,
        avg_length: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length * 100) / 100,
        min_length: Math.min(...lengths),
        max_length: Math.max(...lengths),
        most_common: this.getMostCommon(values, 5),
      };
    });

    return {
      numeric_statistics: numericStats,
      text_statistics: textStats,
      overall_summary: {
        total_records: inputData.length,
        numeric_fields: Object.keys(numericFields).length,
        text_fields: Object.keys(textFields).length,
      },
    };
  }

  private async classifyContent(inputData: any, options: any): Promise<any> {
    const text = typeof inputData === 'string' ? inputData : inputData.text || JSON.stringify(inputData);
    const confidenceThreshold = options.confidenceThreshold || 0.7;

    // Simple content classification
    const categories = [
      { name: 'business', keywords: ['business', 'company', 'corporate', 'enterprise', 'commercial'] },
      { name: 'technology', keywords: ['tech', 'software', 'computer', 'digital', 'ai', 'ml'] },
      { name: 'health', keywords: ['health', 'medical', 'doctor', 'hospital', 'medicine'] },
      { name: 'education', keywords: ['education', 'school', 'university', 'learning', 'student'] },
      { name: 'entertainment', keywords: ['movie', 'music', 'game', 'entertainment', 'fun'] },
    ];

    const textLower = text.toLowerCase();
    const scores = categories.map(category => {
      const matches = category.keywords.filter(keyword => textLower.includes(keyword)).length;
      const score = matches / category.keywords.length;
      return { category: category.name, score, matches };
    });

    const topCategories = scores
      .filter(s => s.score >= confidenceThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Generate tags based on content
    const words = text.split(/\s+/).filter(word => word.length > 3);
    const tags = [...new Set(words.map(w => w.toLowerCase()))]
      .slice(0, 10);

    return {
      categories: topCategories,
      primary_category: topCategories[0]?.category || 'uncategorized',
      confidence: topCategories[0]?.score || 0,
      tags,
      classification_metadata: {
        confidence_threshold: confidenceThreshold,
        total_categories_evaluated: categories.length,
        text_length: text.length,
      },
    };
  }

  private formatOutput(result: any, format: string): any {
    switch (format) {
      case 'summary':
        return {
          summary: this.createSummary(result),
          key_insights: this.extractKeyInsights(result),
        };
      case 'raw':
        return { raw_data: result };
      case 'detailed':
      default:
        return result;
    }
  }

  private createSummary(result: any): string {
    if (result.sentiment) {
      return `Text analysis completed: ${result.sentiment} sentiment (${(result.confidence * 100).toFixed(1)}% confidence)`;
    }
    if (result.cleaned_data) {
      return `Data cleaning completed: ${result.statistics.removed_duplicates} duplicates removed from ${result.statistics.original_count} records`;
    }
    if (result.patterns) {
      return `Pattern analysis completed: ${result.patterns.length} patterns found in ${result.data_summary.total_records} records`;
    }
    if (result.numeric_statistics) {
      return `Statistical analysis completed: ${Object.keys(result.numeric_statistics).length} numeric fields analyzed`;
    }
    if (result.categories) {
      return `Content classification completed: ${result.primary_category} (${(result.confidence * 100).toFixed(1)}% confidence)`;
    }
    return 'Processing completed successfully';
  }

  private extractKeyInsights(result: any): string[] {
    const insights: string[] = [];

    if (result.sentiment) {
      insights.push(`Sentiment is ${result.sentiment} with high confidence`);
      if (result.topics?.length > 0) {
        insights.push(`Key topics: ${result.topics.slice(0, 3).join(', ')}`);
      }
    }

    if (result.patterns) {
      result.patterns.forEach((pattern: any) => {
        insights.push(`${pattern.type}: ${pattern.description}`);
      });
    }

    if (result.categories) {
      insights.push(`Primary category: ${result.primary_category}`);
    }

    return insights.slice(0, 5); // Limit to top 5 insights
  }

  private getMostCommon(arr: string[], limit: number): Array<{ value: string; count: number }> {
    const counts: { [key: string]: number } = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }));
  }
}
```

**Key Tool Metadata Patterns:**

1. **Rich Descriptions:**
   ```ts
   toolMetadata: {
     name: 'Clear, descriptive name',
     description: 'Detailed explanation of what the tool does and its capabilities',
   }
   ```

2. **Parameter Documentation:**
   ```ts
   parameters: [
     {
       name: 'parameter_name',
       type: 'string|number|boolean|object|array',
       description: 'Clear description of what this parameter does',
       required: true,
       examples: ['example1', 'example2'],
     }
   ]
   ```

3. **Usage Examples:**
   ```ts
   examples: [
     {
       name: 'Example name',
       description: 'What this example demonstrates',
       input: { /* example input */ },
       output: { /* expected output */ },
     }
   ]
   ```

4. **Categorization:**
   ```ts
   categories: ['Data Processing', 'AI/ML'],
   tags: ['ai', 'ml', 'data-processing'],
   useCases: ['Specific use case descriptions'],
   ```

5. **Codex Integration:**
   ```ts
   codex: {
     categories: ['Primary Category'],
     subcategories: ['Specific Subcategory'],
     alias: ['alternative names'],
   }
   ```

This comprehensive metadata approach makes nodes highly discoverable and usable by AI systems, improving the overall automation experience!
