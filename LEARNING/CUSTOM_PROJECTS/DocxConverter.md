# Custom Node Analysis: DOCX to Text

This document explores the `DocxToText` node from the `n8n-docx-converter` project, which demonstrates how to convert a `.docx` file to plain text using a third-party library.

---

## 🧩 Node: `DocxToText`

This node extracts raw text from a `.docx` file using the `mammoth` library.

### Key Features

- **Binary Input**:
  - Accepts a binary field name (`inputBinaryField`, default: `data`)
  - Uses `this.helpers.getBinaryDataBuffer()` to extract the file buffer

- **Text Extraction**:
  - Uses `mammoth.extractRawText({ buffer })` to convert DOCX to plain text
  - Outputs the result into a user-defined field (`destinationOutputField`, default: `text`)

- **Error Handling**:
  - Throws a `NodeOperationError` if the binary field is missing

- **Output**:
  - Returns a JSON object with the extracted text under the specified key

---

## 🧠 Teaching Value

This node is a great example for beginners who want to:

- Work with binary file input in n8n
- Use a third-party library to process file content
- Map input to output fields flexibly
- Keep node logic clean and focused

---

## 🧪 Patterns Demonstrated

| Pattern             | Description                                     |
| ------------------- | ----------------------------------------------- |
| Binary Input Buffer | Uses `getBinaryDataBuffer()` to read file input |
| Third-Party Library | Uses `mammoth` to extract text from DOCX        |
| Flexible Output     | User-defined output field for extracted text    |
| Error Handling      | Validates presence of binary input              |

---

## 📦 Summary

| Component      | Pattern                       |
| -------------- | ----------------------------- |
| Input          | Binary DOCX file              |
| Processing     | Text extraction via `mammoth` |
| Output         | JSON with extracted text      |
| Teaching Value | High for binary transform use |

This is a clean, focused node that’s perfect for teaching binary file processing in n8n.
