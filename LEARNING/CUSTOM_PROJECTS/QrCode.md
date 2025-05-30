# Custom Node Analysis: QR Code Generator

This document explores the `QrCode` node from the `n8n-nodes-qrcode` project, which generates a QR code image from a string input.

---

## 🧩 Node: `QrCode`

This node uses the `qrcode` npm package to generate a base64-encoded PNG image and outputs it as both JSON and binary.

### Key Features

- **Input Parameters**:
  - `value`: The string to encode into a QR code
  - `width`: Width of the output image
  - `qrCodeOptions`: Optional nested configuration:
    - `errorCorrectionLevel`: L, M, Q, H
    - `symbolVersion`: QR mask pattern
    - `darkColor` / `lightColor`: Custom colors
    - `scale`: Image scale
    - `attachmentName`: Name of the binary output field

- **Processing**:
  - Generates a base64 PNG using `QRCode.toDataURL()`
  - Converts the base64 to a binary buffer
  - Attaches the image as a binary output with a configurable name

- **Output**:
  - JSON: `{ data: "data:image/png;base64,..." }`
  - Binary: `{ qrcode: <Buffer> }` (or custom name)

---

## 🧠 Teaching Value

This node is a great example for:

- Generating media from user input
- Using a third-party library (`qrcode`)
- Returning both JSON and binary outputs
- Customizing output appearance and metadata
- Keeping logic clean and visual

---

## 🧪 Patterns Demonstrated

| Pattern             | Description                                       |
| ------------------- | ------------------------------------------------- |
| Media Generation    | Creates a QR code image from a string             |
| Base64 to Binary    | Converts data URI to binary buffer                |
| Configurable Output | Customizes image size, color, and attachment name |
| Dual Output         | Returns both JSON and binary                      |

---

## 📦 Summary

| Component      | Pattern                          |
| -------------- | -------------------------------- |
| Input          | String + optional config         |
| Processing     | QR code generation via `qrcode`  |
| Output         | JSON + binary image              |
| Teaching Value | High for visual and low-code use |

This is a clean, visual node that’s perfect for teaching media generation and binary output in n8n.
