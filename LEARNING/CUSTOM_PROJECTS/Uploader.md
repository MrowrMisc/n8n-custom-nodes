# Custom Node Analysis: Twitter Media Upload

This document explores the `TwitterMediaUpload` node from the `n8n-nodes-uploader` project, which demonstrates how to upload binary media to Twitter using OAuth1.

---

## 🧩 Node: `TwitterMediaUpload`

This node uploads an image to Twitter using the `media/upload.json` endpoint.

### Key Features

- **Credential Validation**:
  - Requires `consumerKey`, `consumerSecret`, `accessToken`, `accessSecret`
  - Throws a `NodeOperationError` if any are missing

- **Binary Input Handling**:
  - Accepts a `binaryPropertyName` (default: `data`)
  - If not found, searches for any binary input with an `image/` MIME type
  - Optional `mediaData` string can override binary input

- **FormData Upload**:
  - Uses `form-data` to construct a multipart POST request
  - Includes `command`, `totalBytes`, `mediaType`, and the binary buffer

- **Manual OAuth1 Signing**:
  - Uses a custom `OAuth1Helper` to generate the `Authorization` header
  - Constructs the header manually for the Twitter API

- **Error Handling**:
  - Catches and logs `NodeOperationError`, `NodeApiError`, and unexpected errors
  - Supports `continueOnFail()` to allow partial success

- **Debug Logging**:
  - Logs binary property resolution, media metadata, and request/response details

---

## 🧠 Teaching Value

This node is a great example for beginners and business users who want to:

- Work with binary data in n8n
- Upload files to external APIs
- Use OAuth1 manually (without relying on built-in helpers)
- Handle missing or malformed input gracefully
- Add helpful debug output for troubleshooting

---

## 🧪 Patterns Demonstrated

| Pattern           | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| Binary Fallback   | Searches for any image if the specified property is missing |
| Optional Override | Allows `mediaData` to override binary input                 |
| Manual OAuth1     | Constructs and signs requests without built-in helpers      |
| FormData Upload   | Uses `form-data` to send multipart media                    |
| Error Resilience  | Supports `continueOnFail()` for partial success             |

---

## 📦 Summary

| Component      | Pattern                     |
| -------------- | --------------------------- |
| Input          | Binary or string override   |
| Auth           | Manual OAuth1               |
| Upload Method  | Multipart FormData          |
| Error Handling | Graceful with debug logging |
| Teaching Value | High for business users     |

This is a practical, real-world node that shows how to build robust, user-friendly integrations with external APIs.
