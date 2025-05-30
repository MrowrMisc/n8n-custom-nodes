# Custom Validation

Custom validation ensures data integrity and provides clear feedback when inputs don't meet requirements.

## Key Concepts
- Validate input parameters before processing
- Provide clear, actionable error messages
- Support both synchronous and asynchronous validation
- Use validation for security and data quality

## Validation Patterns
- Field-level validation for individual parameters
- Cross-field validation for related parameters
- Business logic validation for domain rules
- Format validation for structured data

## Complete Custom Validation Examples

### Comprehensive Validation Node

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeParameterOption,
} from 'n8n-workflow';

export class CustomValidationNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Custom Validation',
    name: 'customValidation',
    group: ['transform'],
    version: 1,
    description: 'Demonstrates comprehensive custom validation patterns',
    defaults: {
      name: 'Custom Validation',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Validation Type',
        name: 'validationType',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Email Validation',
            value: 'email',
            description: 'Validate email addresses with custom rules',
          },
          {
            name: 'Phone Validation',
            value: 'phone',
            description: 'Validate phone numbers by country',
          },
          {
            name: 'Date Range Validation',
            value: 'dateRange',
            description: 'Validate date ranges and business rules',
          },
          {
            name: 'Financial Validation',
            value: 'financial',
            description: 'Validate financial data and calculations',
          },
          {
            name: 'Custom Schema Validation',
            value: 'schema',
            description: 'Validate against custom JSON schema',
          },
          {
            name: 'Business Rules Validation',
            value: 'businessRules',
            description: 'Apply complex business logic validation',
          },
        ],
        default: 'email',
      },
      // Email validation fields
      {
        displayName: 'Email Address',
        name: 'emailAddress',
        type: 'string',
        displayOptions: {
          show: {
            validationType: ['email'],
          },
        },
        default: '',
        description: 'Email address to validate',
        placeholder: 'user@example.com',
      },
      {
        displayName: 'Email Validation Rules',
        name: 'emailRules',
        type: 'collection',
        placeholder: 'Add Rule',
        displayOptions: {
          show: {
            validationType: ['email'],
          },
        },
        default: {},
        options: [
          {
            displayName: 'Allow Disposable Emails',
            name: 'allowDisposable',
            type: 'boolean',
            default: false,
            description: 'Allow disposable email addresses',
          },
          {
            displayName: 'Require Corporate Domain',
            name: 'requireCorporate',
            type: 'boolean',
            default: false,
            description: 'Require corporate (non-free) email domains',
          },
          {
            displayName: 'Max Length',
            name: 'maxLength',
            type: 'number',
            default: 254,
            description: 'Maximum email address length',
          },
          {
            displayName: 'Blocked Domains',
            name: 'blockedDomains',
            type: 'string',
            default: '',
            description: 'Comma-separated list of blocked domains',
            placeholder: 'spam.com,fake.org',
          },
        ],
      },
      // Phone validation fields
      {
        displayName: 'Phone Number',
        name: 'phoneNumber',
        type: 'string',
        displayOptions: {
          show: {
            validationType: ['phone'],
          },
        },
        default: '',
        description: 'Phone number to validate',
        placeholder: '+1-555-123-4567',
      },
      {
        displayName: 'Country Code',
        name: 'countryCode',
        type: 'options',
        displayOptions: {
          show: {
            validationType: ['phone'],
          },
        },
        options: [
          { name: 'United States (+1)', value: 'US' },
          { name: 'United Kingdom (+44)', value: 'GB' },
          { name: 'Germany (+49)', value: 'DE' },
          { name: 'France (+33)', value: 'FR' },
          { name: 'Auto-detect', value: 'AUTO' },
        ],
        default: 'US',
        description: 'Country for phone number validation',
      },
      // Date range validation fields
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        displayOptions: {
          show: {
            validationType: ['dateRange'],
          },
        },
        default: '',
        description: 'Start date of the range',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        displayOptions: {
          show: {
            validationType: ['dateRange'],
          },
        },
        default: '',
        description: 'End date of the range',
      },
      {
        displayName: 'Date Rules',
        name: 'dateRules',
        type: 'collection',
        placeholder: 'Add Rule',
        displayOptions: {
          show: {
            validationType: ['dateRange'],
          },
        },
        default: {},
        options: [
          {
            displayName: 'Max Range Days',
            name: 'maxRangeDays',
            type: 'number',
            default: 365,
            description: 'Maximum allowed days in range',
          },
          {
            displayName: 'Allow Future Dates',
            name: 'allowFuture',
            type: 'boolean',
            default: true,
            description: 'Allow dates in the future',
          },
          {
            displayName: 'Business Days Only',
            name: 'businessDaysOnly',
            type: 'boolean',
            default: false,
            description: 'Only allow business days (Mon-Fri)',
          },
        ],
      },
      // Financial validation fields
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'number',
        displayOptions: {
          show: {
            validationType: ['financial'],
          },
        },
        default: 0,
        description: 'Financial amount to validate',
      },
      {
        displayName: 'Currency',
        name: 'currency',
        type: 'options',
        displayOptions: {
          show: {
            validationType: ['financial'],
          },
        },
        options: [
          { name: 'US Dollar (USD)', value: 'USD' },
          { name: 'Euro (EUR)', value: 'EUR' },
          { name: 'British Pound (GBP)', value: 'GBP' },
          { name: 'Japanese Yen (JPY)', value: 'JPY' },
        ],
        default: 'USD',
        description: 'Currency for the amount',
      },
      {
        displayName: 'Financial Rules',
        name: 'financialRules',
        type: 'collection',
        placeholder: 'Add Rule',
        displayOptions: {
          show: {
            validationType: ['financial'],
          },
        },
        default: {},
        options: [
          {
            displayName: 'Min Amount',
            name: 'minAmount',
            type: 'number',
            default: 0,
            description: 'Minimum allowed amount',
          },
          {
            displayName: 'Max Amount',
            name: 'maxAmount',
            type: 'number',
            default: 1000000,
            description: 'Maximum allowed amount',
          },
          {
            displayName: 'Decimal Places',
            name: 'decimalPlaces',
            type: 'number',
            default: 2,
            description: 'Required number of decimal places',
          },
          {
            displayName: 'Require Positive',
            name: 'requirePositive',
            type: 'boolean',
            default: true,
            description: 'Amount must be positive',
          },
        ],
      },
      // Schema validation fields
      {
        displayName: 'JSON Data',
        name: 'jsonData',
        type: 'json',
        displayOptions: {
          show: {
            validationType: ['schema'],
          },
        },
        default: '{}',
        description: 'JSON data to validate against schema',
      },
      {
        displayName: 'JSON Schema',
        name: 'jsonSchema',
        type: 'json',
        displayOptions: {
          show: {
            validationType: ['schema'],
          },
        },
        default: '{"type": "object", "properties": {}}',
        description: 'JSON schema for validation',
      },
      // Business rules validation
      {
        displayName: 'User Data',
        name: 'userData',
        type: 'json',
        displayOptions: {
          show: {
            validationType: ['businessRules'],
          },
        },
        default: '{"age": 25, "country": "US", "income": 50000}',
        description: 'User data for business rules validation',
      },
      {
        displayName: 'Validation Options',
        name: 'validationOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Strict Mode',
            name: 'strictMode',
            type: 'boolean',
            default: false,
            description: 'Enable strict validation (fail on warnings)',
          },
          {
            displayName: 'Return Details',
            name: 'returnDetails',
            type: 'boolean',
            default: true,
            description: 'Return detailed validation results',
          },
          {
            displayName: 'Custom Error Messages',
            name: 'customErrorMessages',
            type: 'boolean',
            default: false,
            description: 'Use custom error messages',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const validationType = this.getNodeParameter('validationType', i) as string;
        const validationOptions = this.getNodeParameter('validationOptions', i, {}) as any;

        let validationResult: any;

        switch (validationType) {
          case 'email':
            validationResult = await this.validateEmail(i);
            break;
          case 'phone':
            validationResult = await this.validatePhone(i);
            break;
          case 'dateRange':
            validationResult = await this.validateDateRange(i);
            break;
          case 'financial':
            validationResult = await this.validateFinancial(i);
            break;
          case 'schema':
            validationResult = await this.validateSchema(i);
            break;
          case 'businessRules':
            validationResult = await this.validateBusinessRules(i);
            break;
          default:
            throw new NodeOperationError(
              this.getNode(),
              `Unknown validation type: ${validationType}`,
              { itemIndex: i }
            );
        }

        // Handle validation results based on options
        if (!validationResult.isValid && validationOptions.strictMode) {
          throw new NodeOperationError(
            this.getNode(),
            `Validation failed: ${validationResult.errors.join(', ')}`,
            { itemIndex: i }
          );
        }

        const result: any = {
          validationType,
          isValid: validationResult.isValid,
          success: validationResult.isValid,
        };

        if (validationOptions.returnDetails) {
          result.details = validationResult;
        } else {
          result.summary = this.createValidationSummary(validationResult);
        }

        returnData.push({
          json: {
            ...result,
            metadata: {
              validated_at: new Date().toISOString(),
              item_index: i,
              validation_options: validationOptions,
            },
          },
        });

      } catch (error) {
        throw new NodeOperationError(
          this.getNode(),
          `Validation error: ${error.message}`,
          { itemIndex: i }
        );
      }
    }

    return [returnData];
  }

  private async validateEmail(itemIndex: number): Promise<any> {
    const emailAddress = this.getNodeParameter('emailAddress', itemIndex) as string;
    const emailRules = this.getNodeParameter('emailRules', itemIndex, {}) as any;

    const errors: string[] = [];
    const warnings: string[] = [];
    const details: any = {};

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      errors.push('Invalid email format');
    }

    // Length validation
    const maxLength = emailRules.maxLength || 254;
    if (emailAddress.length > maxLength) {
      errors.push(`Email too long (max ${maxLength} characters)`);
    }

    // Domain extraction and validation
    const domain = emailAddress.split('@')[1]?.toLowerCase();
    if (domain) {
      details.domain = domain;

      // Blocked domains check
      if (emailRules.blockedDomains) {
        const blockedDomains = emailRules.blockedDomains.split(',').map((d: string) => d.trim().toLowerCase());
        if (blockedDomains.includes(domain)) {
          errors.push(`Domain ${domain} is blocked`);
        }
      }

      // Disposable email check
      const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
      const isDisposable = disposableDomains.includes(domain);
      details.isDisposable = isDisposable;

      if (isDisposable && !emailRules.allowDisposable) {
        errors.push('Disposable email addresses are not allowed');
      }

      // Corporate domain check
      const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      const isFree = freeDomains.includes(domain);
      details.isCorporate = !isFree;

      if (emailRules.requireCorporate && isFree) {
        errors.push('Corporate email address required');
      }

      // Domain validation (simplified DNS check simulation)
      details.domainValid = await this.simulateDomainValidation(domain);
      if (!details.domainValid) {
        warnings.push('Domain may not exist or be unreachable');
      }
    }

    // Additional checks
    const localPart = emailAddress.split('@')[0];
    if (localPart) {
      details.localPart = localPart;
      
      // Check for suspicious patterns
      if (localPart.includes('test') || localPart.includes('example')) {
        warnings.push('Email appears to be a test address');
      }

      // Check for consecutive dots or special characters
      if (localPart.includes('..') || localPart.startsWith('.') || localPart.endsWith('.')) {
        errors.push('Invalid local part format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details,
      email: emailAddress,
    };
  }

  private async validatePhone(itemIndex: number): Promise<any> {
    const phoneNumber = this.getNodeParameter('phoneNumber', itemIndex) as string;
    const countryCode = this.getNodeParameter('countryCode', itemIndex) as string;

    const errors: string[] = [];
    const warnings: string[] = [];
    const details: any = {};

    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    details.cleanedNumber = cleanedPhone;

    // Country-specific validation
    const phonePatterns: { [key: string]: { pattern: RegExp; length: number; format: string } } = {
      US: { pattern: /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/, length: 10, format: '+1-XXX-XXX-XXXX' },
      GB: { pattern: /^\+?44[1-9]\d{8,9}$/, length: 11, format: '+44-XXXX-XXXXXX' },
      DE: { pattern: /^\+?49[1-9]\d{10,11}$/, length: 11, format: '+49-XXX-XXXXXXXX' },
      FR: { pattern: /^\+?33[1-9]\d{8}$/, length: 10, format: '+33-X-XX-XX-XX-XX' },
    };

    let detectedCountry = countryCode;
    if (countryCode === 'AUTO') {
      // Auto-detect country based on prefix
      if (cleanedPhone.startsWith('+1') || cleanedPhone.startsWith('1')) {
        detectedCountry = 'US';
      } else if (cleanedPhone.startsWith('+44')) {
        detectedCountry = 'GB';
      } else if (cleanedPhone.startsWith('+49')) {
        detectedCountry = 'DE';
      } else if (cleanedPhone.startsWith('+33')) {
        detectedCountry = 'FR';
      } else {
        warnings.push('Could not auto-detect country code');
        detectedCountry = 'US'; // Default fallback
      }
    }

    details.detectedCountry = detectedCountry;
    const pattern = phonePatterns[detectedCountry];

    if (pattern) {
      details.expectedFormat = pattern.format;
      
      if (!pattern.pattern.test(cleanedPhone)) {
        errors.push(`Invalid ${detectedCountry} phone number format`);
      }

      // Length validation
      const numberWithoutCountryCode = cleanedPhone.replace(/^\+?\d{1,3}/, '');
      if (numberWithoutCountryCode.length !== pattern.length) {
        errors.push(`Phone number should have ${pattern.length} digits (excluding country code)`);
      }
    } else {
      warnings.push(`Validation pattern not available for country: ${detectedCountry}`);
    }

    // General validations
    if (cleanedPhone.length < 7) {
      errors.push('Phone number too short');
    }

    if (cleanedPhone.length > 15) {
      errors.push('Phone number too long');
    }

    // Check for suspicious patterns
    const repeatingPattern = /(\d)\1{6,}/;
    if (repeatingPattern.test(cleanedPhone)) {
      warnings.push('Phone number contains suspicious repeating digits');
    }

    // Format the number for display
    details.formattedNumber = this.formatPhoneNumber(cleanedPhone, detectedCountry);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details,
      phoneNumber,
    };
  }

  private async validateDateRange(itemIndex: number): Promise<any> {
    const startDateStr = this.getNodeParameter('startDate', itemIndex) as string;
    const endDateStr = this.getNodeParameter('endDate', itemIndex) as string;
    const dateRules = this.getNodeParameter('dateRules', itemIndex, {}) as any;

    const errors: string[] = [];
    const warnings: string[] = [];
    const details: any = {};

    // Parse dates
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const now = new Date();

    details.startDate = startDate.toISOString();
    details.endDate = endDate.toISOString();

    // Basic date validation
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date');
    }

    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date');
    }

    if (errors.length === 0) {
      // Range validation
      if (startDate >= endDate) {
        errors.push('Start date must be before end date');
      }

      // Calculate range
      const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      details.rangeDays = rangeDays;

      // Max range validation
      const maxRangeDays = dateRules.maxRangeDays || 365;
      if (rangeDays > maxRangeDays) {
        errors.push(`Date range too large (max ${maxRangeDays} days)`);
      }

      // Future date validation
      if (!dateRules.allowFuture) {
        if (startDate > now) {
          errors.push('Start date cannot be in the future');
        }
        if (endDate > now) {
          errors.push('End date cannot be in the future');
        }
      }

      // Business days validation
      if (dateRules.businessDaysOnly) {
        const startDay = startDate.getDay();
        const endDay = endDate.getDay();

        if (startDay === 0 || startDay === 6) {
          errors.push('Start date must be a business day (Monday-Friday)');
        }

        if (endDay === 0 || endDay === 6) {
          errors.push('End date must be a business day (Monday-Friday)');
        }
      }

      // Calculate business days in range
      details.businessDays = this.calculateBusinessDays(startDate, endDate);
      details.weekendDays = rangeDays - details.businessDays;

      // Additional insights
      if (rangeDays > 30) {
        warnings.push('Long date range may impact performance');
      }

      if (startDate.getFullYear() !== endDate.getFullYear()) {
        warnings.push('Date range spans multiple years');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details,
      startDate: startDateStr,
      endDate: endDateStr,
    };
  }

  private async validateFinancial(itemIndex: number): Promise<any> {
    const amount = this.getNodeParameter('amount', itemIndex) as number;
    const currency = this.getNodeParameter('currency', itemIndex) as string;
    const financialRules = this.getNodeParameter('financialRules', itemIndex, {}) as any;

    const errors: string[] = [];
    const warnings: string[] = [];
    const details: any = {};

    details.amount = amount;
    details.currency = currency;

    // Basic amount validation
    if (typeof amount !== 'number' || isNaN(amount)) {
      errors.push('Amount must be a valid number');
      return { isValid: false, errors, warnings, details, amount, currency };
    }

    // Positive amount validation
    if (financialRules.requirePositive && amount <= 0) {
      errors.push('Amount must be positive');
    }

    // Range validation
    const minAmount = financialRules.minAmount ?? 0;
    const maxAmount = financialRules.maxAmount ?? 1000000;

    if (amount < minAmount) {
      errors.push(`Amount below minimum (${minAmount} ${currency})`);
    }

    if (amount > maxAmount) {
      errors.push(`Amount exceeds maximum (${maxAmount} ${currency})`);
    }

    // Decimal places validation
    const decimalPlaces = financialRules.decimalPlaces ?? 2;
    const amountStr = amount.toString();
    const decimalIndex = amountStr.indexOf('.');

    if (decimalIndex !== -1) {
      const actualDecimalPlaces = amountStr.length - decimalIndex - 1;
      details.decimalPlaces = actualDecimalPlaces;

      if (actualDecimalPlaces > decimalPlaces) {
        errors.push(`Too many decimal places (max ${decimalPlaces})`);
      }
    } else {
      details.decimalPlaces = 0;
    }

    // Currency-specific validation
    const currencyRules: { [key: string]: { minorUnit: number; maxAmount: number } } = {
      USD: { minorUnit: 2, maxAmount: 1000000 },
      EUR: { minorUnit: 2, maxAmount: 1000000 },
      GBP: { minorUnit: 2, maxAmount: 1000000 },
      JPY: { minorUnit: 0, maxAmount: 100000000 },
    };

    const currencyRule = currencyRules[currency];
    if (currencyRule) {
      details.currencyRule = currencyRule;

      if (decimalPlaces !== currencyRule.minorUnit) {
        warnings.push(`${currency} typically uses ${currencyRule.minorUnit} decimal places`);
      }

      if (amount > currencyRule.maxAmount) {
        warnings.push(`Large amount for ${currency} currency`);
      }
    }

    // Format amount for display
    details.formattedAmount = this.formatCurrency(amount, currency);

    // Fraud detection patterns
    const fraudPatterns = [
      { pattern: /\.99$/, message: 'Suspicious pricing pattern (.99 ending)' },
      { pattern: /^9{3,}/, message: 'Suspicious amount pattern (multiple 9s)' },
    ];

    fraudPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(amountStr)) {
        warnings.push(message);
      }
    });

    // Large transaction warning
    if (amount > 10000) {
      warnings.push('Large transaction amount - may require additional verification');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details,
      amount,
      currency,
    };
  }

  private async validateSchema(itemIndex: number): Promise<any> {
    const jsonDataStr = this.getNodeParameter('jsonData', itemIndex) as string;
    const jsonSchemaStr = this.getNodeParameter('jsonSchema', itemIndex) as string;

    const errors: string[] = [];
    const warnings: string[] = [];
    const details: any = {};

    try {
      // Parse JSON data
      const jsonData = JSON.parse(jsonDataStr);
      details.parsedData = jsonData;

      // Parse JSON schema
      const jsonSchema = JSON.parse(jsonSchemaStr);
      details.schema = jsonSchema;

      // Perform schema validation (simplified implementation)
      const validationResult = this.validateAgainstSchema(jsonData, jsonSchema);
      
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
      details.validationDetails = validationResult.details;

    } catch (error) {
      if (error.message.includes('JSON')) {
        errors.push(`JSON parsing error: ${error.message}`);
      } else {
        errors.push(`Schema validation error: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details,
      jsonData: jsonDataStr,
      jsonSchema: jsonSchemaStr,
    };
  }

  private async validateBusinessRules(itemIndex: number): Promise<any> {
    const userDataStr = this.getNodeParameter('userData', itemIndex) as string;

    const errors: string[] = [];
    const warnings: string[] = [];
    const details: any = {};

    try {
      const userData = JSON.parse(userDataStr);
      details.userData = userData;

      // Age validation
      if (userData.age !== undefined) {
        if (typeof userData.age !== 'number' || userData.age < 0 || userData.age > 150) {
          errors.push('Invalid age (must be 0-150)');
        } else if (userData.age < 18) {
          warnings.push('User is under 18 years old');
        } else if (userData.age > 65) {
          warnings.push('User is over retirement age');
        }
      }

      // Income validation
      if (userData.income !== undefined) {
        if (typeof userData.income !== 'number' || userData.income < 0) {
          errors.push('Invalid income (must be positive number)');
        } else {
          // Income brackets
          if (userData.income < 25000) {
            details.incomeCategory = 'low';
          } else if (userData.income < 75000) {
            details.incomeCategory = 'medium';
          } else {
            details.incomeCategory = 'high';
          }

          // Age-income correlation check
          if (userData.age && userData.age < 25 && userData.income > 100000) {
            warnings.push('High income for young age - verify data accuracy');
          }
        }
      }

      // Country validation
      if (userData.country) {
        const validCountries = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP'];
        if (!validCountries.includes(userData.country)) {
          warnings.push(`Country ${userData.country} not in supported list`);
        }
        details.countrySupported = validCountries.includes(userData.country);
      }

      // Cross-field business rules
      if (userData.age && userData.income && userData.country) {
        // Eligibility rules
        const eligibilityRules = [
          {
            name: 'premium_service',
            condition: userData.age >= 21 && userData.income >= 50000,
            message: 'Eligible for premium service',
          },
          {
            name: 'student_discount',
            condition: userData.age >= 16 && userData.age <= 25 && userData.income < 30000,
            message: 'Eligible for student discount',
          },
          {
            name: 'senior_benefits',
            condition: userData.age >= 65,
            message: 'Eligible for senior benefits',
          },
        ];

        details.eligibility = {};
        eligibilityRules.forEach(rule => {
          details.eligibility[rule.name] = rule.condition;
          if (rule.condition) {
            warnings.push(rule.message);
          }
        });

        // Risk assessment
        let riskScore = 0;
        if (userData.age < 25) riskScore += 1;
        if (userData.income < 25000) riskScore += 2;
        if (!['US', 'CA', 'GB'].includes(userData.country)) riskScore += 1;

        details.riskScore = riskScore;
        details.riskLevel = riskScore <= 1 ? 'low' : riskScore <= 3 ? 'medium' : 'high';

        if (riskScore > 3) {
          warnings.push('High risk profile - additional verification may be required');
        }
      }

    } catch (error) {
      errors.push(`JSON parsing error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details,
      userData: userDataStr,
    };
  }

  // Helper methods
  private async simulateDomainValidation(domain: string): Promise<boolean> {
    // Simulate DNS validation - in real implementation use dns.resolve()
    const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com', 'test.com'];
    return validDomains.includes(domain) || Math.random() > 0.1; // 90% valid
  }

  private formatPhoneNumber(phone: string, country: string): string {
    // Simple phone formatting based on country
    const cleaned = phone.replace(/^\+?\d{1,3}/, ''); // Remove country code
    
    switch (country) {
      case 'US':
        return `+1-${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      case 'GB':
        return `+44-${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
      case 'DE':
        return `+49-${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      case 'FR':
        return `+33-${cleaned.slice(0, 1)}-${cleaned.slice(1, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 7)}-${cleaned.slice(7)}`;
      default:
        return phone;
    }
  }

  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    let businessDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return businessDays;
  }

  private formatCurrency(amount: number, currency: string): string {
    const formatters: { [key: string]: Intl.NumberFormat } = {
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
    };
    
    const formatter = formatters[currency];
    return formatter ? formatter.format(amount) : `${amount} ${currency}`;
  }

  private validateAgainstSchema(data: any, schema: any): { errors: string[]; warnings: string[]; details: any } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const details: any = {};

    // Simplified JSON schema validation
    if (schema.type) {
      const actualType = Array.isArray(data) ? 'array' : typeof data;
      if (actualType !== schema.type) {
        errors.push(`Expected type ${schema.type}, got ${actualType}`);
      }
      details.typeValid = actualType === schema.type;
    }

    if (schema.type === 'object' && schema.properties) {
      details.propertyValidation = {};
      
      // Check required properties
      if (schema.required) {
        schema.required.forEach((prop: string) => {
          if (!(prop in data)) {
            errors.push(`Missing required property: ${prop}`);
          }
        });
      }

      // Validate each property
      Object.entries(schema.properties).forEach(([prop, propSchema]: [string, any]) => {
        if (prop in data) {
          const propValue = data[prop];
          const propType = Array.isArray(propValue) ? 'array' : typeof propValue;
          
          details.propertyValidation[prop] = { valid: true };
          
          if (propSchema.type && propType !== propSchema.type) {
            errors.push(`Property ${prop}: expected ${propSchema.type}, got ${propType}`);
            details.propertyValidation[prop].valid = false;
          }
          
          if (propSchema.minLength && typeof propValue === 'string' && propValue.length < propSchema.minLength) {
            errors.push(`Property ${prop}: too short (min ${propSchema.minLength})`);
          }
          
          if (propSchema.maxLength && typeof propValue === 'string' && propValue.length > propSchema.maxLength) {
            errors.push(`Property ${prop}: too long (max ${propSchema.maxLength})`);
          }
          
          if (propSchema.minimum && typeof propValue === 'number' && propValue < propSchema.minimum) {
            errors.push(`Property ${prop}: below minimum (${propSchema.minimum})`);
          }
          
          if (propSchema.maximum && typeof propValue === 'number' && propValue > propSchema.maximum) {
            errors.push(`Property ${prop}: above maximum (${propSchema.maximum})`);
          }
        }
      });
      
      // Check for additional properties
      if (schema.additionalProperties === false) {
        Object.keys(data).forEach(prop => {
          if (!(prop in schema.properties)) {
            warnings.push(`Additional property not allowed: ${prop}`);
          }
        });
      }
    }

    if (schema.type === 'array') {
      if (schema.minItems && data.length < schema.minItems) {
        errors.push(`Array too short (min ${schema.minItems} items)`);
      }
      
      if (schema.maxItems && data.length > schema.maxItems) {
        errors.push(`Array too long (max ${schema.maxItems} items)`);
      }
      
      details.arrayLength = data.length;
    }

    return { errors, warnings, details };
  }

  private createValidationSummary(result: any): string {
    if (result.isValid) {
      return `Validation passed${result.warnings?.length ? ` with ${result.warnings.length} warnings` : ''}`;
    } else {
      return `Validation failed: ${result.errors.length} errors${result.warnings?.length ? `, ${result.warnings.length} warnings` : ''}`;
    }
  }
}
```

**Key Custom Validation Patterns:**

1. **Field-Level Validation:**
   ```ts
   if (!emailRegex.test(emailAddress)) {
     errors.push('Invalid email format');
   }
   ```

2. **Cross-Field Validation:**
   ```ts
   if (startDate >= endDate) {
     errors.push('Start date must be before end date');
   }
   ```

3. **Business Rules Validation:**
   ```ts
   if (userData.age < 25 && userData.income > 100000) {
     warnings.push('High income for young age - verify data accuracy');
   }
   ```

4. **Schema Validation:**
   ```ts
   const validationResult = this.validateAgainstSchema(jsonData, jsonSchema);
   errors.push(...validationResult.errors);
   ```

5. **Conditional Validation:**
   ```ts
   if (financialRules.requirePositive && amount <= 0) {
     errors.push('Amount must be positive');
   }
   ```

6. **Format Validation:**
   ```ts
   const phonePatterns = {
     US: { pattern: /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/, length: 10 }
   };
   ```

7. **Warning vs Error Handling:**
   ```ts
   // Errors stop processing
   errors.push('Critical validation failure');
   
   // Warnings allow processing to continue
   warnings.push('Data quality concern');
   ```

This comprehensive validation approach ensures data quality, security, and provides excellent user feedback for any validation issues!
