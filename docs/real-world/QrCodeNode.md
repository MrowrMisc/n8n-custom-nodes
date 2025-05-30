# QR Code Generator Node

This node generates QR codes from input text using a local library or external API.

## Key Features
- Accepts text input and outputs a QR image
- Can return base64, binary, or image URL
- Supports customization (size, error correction)

## Implementation Highlights
- Uses `qrcode` npm package or HTTP API
- Converts text to image buffer
- Attaches image to `item.binary`

## Use Cases
- Generate QR codes for links or IDs
- Embed QR in PDFs or emails
- Create scannable labels or tickets

## Teaching Value
- Demonstrates binary output generation
- Shows how to use `prepareBinaryData()`
- Great example of a utility node

## Complete QR Code Generator Implementation

Here's a full QR code generator node that creates QR codes and returns them as binary data:

```ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';
import * as QRCode from 'qrcode';

export class QrCodeGenerator implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'QR Code Generator',
    name: 'qrCodeGenerator',
    icon: 'file:qrcode.svg',
    group: ['transform'],
    version: 1,
    description: 'Generate QR codes from text input',
    defaults: {
      name: 'QR Code Generator',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Text to Encode',
        name: 'text',
        type: 'string',
        default: '',
        required: true,
        description: 'The text to encode in the QR code',
        placeholder: 'https://example.com or any text',
      },
      {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        options: [
          {
            name: 'PNG Image',
            value: 'png',
            description: 'Generate PNG image file',
          },
          {
            name: 'SVG Vector',
            value: 'svg',
            description: 'Generate SVG vector file',
          },
          {
            name: 'Base64 Data URL',
            value: 'dataurl',
            description: 'Generate base64 data URL',
          },
        ],
        default: 'png',
        description: 'The format for the QR code output',
      },
      {
        displayName: 'Size (pixels)',
        name: 'size',
        type: 'number',
        default: 200,
        description: 'Size of the QR code in pixels',
        displayOptions: {
          show: {
            outputFormat: ['png'],
          },
        },
      },
      {
        displayName: 'Error Correction Level',
        name: 'errorCorrectionLevel',
        type: 'options',
        options: [
          {
            name: 'Low (~7%)',
            value: 'L',
            description: 'Low error correction, smaller QR code',
          },
          {
            name: 'Medium (~15%)',
            value: 'M',
            description: 'Medium error correction (recommended)',
          },
          {
            name: 'Quartile (~25%)',
            value: 'Q',
            description: 'High error correction',
          },
          {
            name: 'High (~30%)',
            value: 'H',
            description: 'Highest error correction, larger QR code',
          },
        ],
        default: 'M',
        description: 'Error correction level for the QR code',
      },
      {
        displayName: 'Margin',
        name: 'margin',
        type: 'number',
        default: 4,
        description: 'Margin around the QR code (in modules)',
      },
      {
        displayName: 'Dark Color',
        name: 'darkColor',
        type: 'string',
        default: '#000000',
        description: 'Color of the dark modules (hex color)',
        placeholder: '#000000',
      },
      {
        displayName: 'Light Color',
        name: 'lightColor',
        type: 'string',
        default: '#FFFFFF',
        description: 'Color of the light modules (hex color)',
        placeholder: '#FFFFFF',
      },
      {
        displayName: 'Binary Property Name',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'qrcode',
        description: 'Name of the binary property to store the QR code',
        displayOptions: {
          show: {
            outputFormat: ['png', 'svg'],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const text = this.getNodeParameter('text', i) as string;
        const outputFormat = this.getNodeParameter('outputFormat', i) as string;
        const size = this.getNodeParameter('size', i) as number;
        const errorCorrectionLevel = this.getNodeParameter('errorCorrectionLevel', i) as 'L' | 'M' | 'Q' | 'H';
        const margin = this.getNodeParameter('margin', i) as number;
        const darkColor = this.getNodeParameter('darkColor', i) as string;
        const lightColor = this.getNodeParameter('lightColor', i) as string;
        const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

        if (!text.trim()) {
          throw new NodeOperationError(
            this.getNode(),
            'Text to encode cannot be empty',
            { itemIndex: i }
          );
        }

        // QR code generation options
        const qrOptions: QRCode.QRCodeToBufferOptions = {
          errorCorrectionLevel,
          margin,
          color: {
            dark: darkColor,
            light: lightColor,
          },
        };

        let result: INodeExecutionData;

        if (outputFormat === 'png') {
          // Generate PNG buffer
          const qrBuffer = await QRCode.toBuffer(text, {
            ...qrOptions,
            width: size,
            type: 'png',
          });

          // Prepare binary data
          const binaryData = await this.helpers.prepareBinaryData(
            qrBuffer,
            `qrcode_${i}.png`,
            'image/png'
          );

          result = {
            json: {
              text,
              format: 'png',
              size,
              errorCorrectionLevel,
              filename: `qrcode_${i}.png`,
            },
            binary: {
              [binaryPropertyName]: binaryData,
            },
          };

        } else if (outputFormat === 'svg') {
          // Generate SVG string
          const svgString = await QRCode.toString(text, {
            ...qrOptions,
            type: 'svg',
          });

          // Convert SVG string to buffer
          const svgBuffer = Buffer.from(svgString, 'utf8');

          // Prepare binary data
          const binaryData = await this.helpers.prepareBinaryData(
            svgBuffer,
            `qrcode_${i}.svg`,
            'image/svg+xml'
          );

          result = {
            json: {
              text,
              format: 'svg',
              errorCorrectionLevel,
              filename: `qrcode_${i}.svg`,
              svgContent: svgString,
            },
            binary: {
              [binaryPropertyName]: binaryData,
            },
          };

        } else if (outputFormat === 'dataurl') {
          // Generate base64 data URL
          const dataUrl = await QRCode.toDataURL(text, {
            ...qrOptions,
            width: size,
          });

          result = {
            json: {
              text,
              format: 'dataurl',
              size,
              errorCorrectionLevel,
              dataUrl,
              // Extract just the base64 part (without data:image/png;base64,)
              base64: dataUrl.split(',')[1],
            },
          };

        } else {
          throw new NodeOperationError(
            this.getNode(),
            `Unsupported output format: ${outputFormat}`,
            { itemIndex: i }
          );
        }

        returnData.push(result);

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              item: i,
            },
          });
          continue;
        }

        throw new NodeApiError(this.getNode(), error, {
          message: `Failed to generate QR code for item ${i}`,
          description: error.message,
        });
      }
    }

    return [returnData];
  }
}
```

**Advanced QR Code Node with Special Formats:**
```ts
export class AdvancedQrCodeGenerator implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Advanced QR Code Generator',
    name: 'advancedQrCodeGenerator',
    icon: 'file:qrcode.svg',
    group: ['transform'],
    version: 1,
    description: 'Generate QR codes with special formats (WiFi, vCard, etc.)',
    defaults: {
      name: 'Advanced QR Code Generator',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Input Type',
        name: 'inputType',
        type: 'options',
        options: [
          {
            name: 'Text',
            value: 'text',
            description: 'Plain text input',
          },
          {
            name: 'URL',
            value: 'url',
            description: 'URL with validation',
          },
          {
            name: 'WiFi',
            value: 'wifi',
            description: 'WiFi network credentials',
          },
          {
            name: 'Contact (vCard)',
            value: 'vcard',
            description: 'Contact information',
          },
        ],
        default: 'text',
        description: 'Type of data to encode',
      },
      {
        displayName: 'Text',
        name: 'text',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            inputType: ['text'],
          },
        },
        description: 'Plain text to encode',
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            inputType: ['url'],
          },
        },
        description: 'URL to encode (will be validated)',
        placeholder: 'https://example.com',
      },
      {
        displayName: 'WiFi Network Name (SSID)',
        name: 'wifiSSID',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            inputType: ['wifi'],
          },
        },
        description: 'WiFi network name',
      },
      {
        displayName: 'WiFi Password',
        name: 'wifiPassword',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            inputType: ['wifi'],
          },
        },
        description: 'WiFi password (leave empty for open networks)',
      },
      {
        displayName: 'WiFi Security',
        name: 'wifiSecurity',
        type: 'options',
        options: [
          { name: 'WPA/WPA2', value: 'WPA' },
          { name: 'WEP', value: 'WEP' },
          { name: 'Open', value: 'nopass' },
        ],
        default: 'WPA',
        displayOptions: {
          show: {
            inputType: ['wifi'],
          },
        },
        description: 'WiFi security type',
      },
      {
        displayName: 'Contact Name',
        name: 'contactName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            inputType: ['vcard'],
          },
        },
        description: 'Full name of the contact',
      },
      {
        displayName: 'Phone Number',
        name: 'contactPhone',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            inputType: ['vcard'],
          },
        },
        description: 'Phone number',
      },
      {
        displayName: 'Email',
        name: 'contactEmail',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            inputType: ['vcard'],
          },
        },
        description: 'Email address',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const inputType = this.getNodeParameter('inputType', i) as string;
        let textToEncode: string;

        // Generate content based on input type
        switch (inputType) {
          case 'text':
            textToEncode = this.getNodeParameter('text', i) as string;
            break;

          case 'url':
            const url = this.getNodeParameter('url', i) as string;
            // Validate URL
            try {
              new URL(url);
              textToEncode = url;
            } catch {
              throw new NodeOperationError(
                this.getNode(),
                `Invalid URL format: ${url}`,
                { itemIndex: i }
              );
            }
            break;

          case 'wifi':
            const ssid = this.getNodeParameter('wifiSSID', i) as string;
            const password = this.getNodeParameter('wifiPassword', i) as string;
            const security = this.getNodeParameter('wifiSecurity', i) as string;
            
            // Generate WiFi QR code format
            textToEncode = `WIFI:T:${security};S:${ssid};P:${password};;`;
            break;

          case 'vcard':
            const name = this.getNodeParameter('contactName', i) as string;
            const phone = this.getNodeParameter('contactPhone', i) as string;
            const email = this.getNodeParameter('contactEmail', i) as string;
            
            // Generate vCard format
            textToEncode = [
              'BEGIN:VCARD',
              'VERSION:3.0',
              `FN:${name}`,
              phone ? `TEL:${phone}` : '',
              email ? `EMAIL:${email}` : '',
              'END:VCARD',
            ].filter(Boolean).join('\n');
            break;

          default:
            throw new NodeOperationError(
              this.getNode(),
              `Unsupported input type: ${inputType}`,
              { itemIndex: i }
            );
        }

        // Generate QR code using the same logic as basic version
        const qrBuffer = await QRCode.toBuffer(textToEncode, {
          errorCorrectionLevel: 'M',
          width: 200,
        });

        const binaryData = await this.helpers.prepareBinaryData(
          qrBuffer,
          `qrcode_${inputType}_${i}.png`,
          'image/png'
        );

        returnData.push({
          json: {
            inputType,
            originalText: textToEncode,
            filename: `qrcode_${inputType}_${i}.png`,
          },
          binary: {
            qrcode: binaryData,
          },
        });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              item: i,
            },
          });
          continue;
        }

        throw new NodeApiError(this.getNode(), error, {
          message: `Failed to generate QR code for item ${i}`,
          description: error.message,
        });
      }
    }

    return [returnData];
  }
}
```

**Usage Examples:**

1. **Basic Text QR Code:**
   - Input: "Hello, World!"
   - Output: PNG image with QR code

2. **URL QR Code:**
   - Input: "https://n8n.io"
   - Output: Scannable link QR code

3. **WiFi QR Code:**
   - SSID: "MyNetwork"
   - Password: "mypassword123"
   - Security: "WPA"
   - Output: QR code that automatically connects devices to WiFi

4. **Contact vCard:**
   - Name: "John Doe"
   - Phone: "+1234567890"
   - Email: "john@example.com"
   - Output: QR code that adds contact to phone

This QR code generator demonstrates:
- **Binary data handling**: Using `prepareBinaryData()` for images
- **Multiple output formats**: PNG, SVG, and base64 data URLs
- **Input validation**: URL validation and error handling
- **Specialized formats**: WiFi and vCard QR codes
- **Customization options**: Size, colors, error correction
- **Error handling**: Graceful failures with detailed messages

Perfect for generating scannable codes for websites, contact sharing, WiFi access, and more!
