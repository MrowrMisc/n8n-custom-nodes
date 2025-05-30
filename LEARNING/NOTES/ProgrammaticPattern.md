# Programmatic Pattern

The programmatic pattern in n8n gives you full control over node behavior by implementing an `execute()` method. It’s the go-to approach for complex APIs, dynamic logic, and advanced workflows.

---

## 🧩 What It Is

- Node logic is written imperatively inside an `async execute()` method.
- You can use any JavaScript/TypeScript logic to process inputs, make requests, and return outputs.
- Ideal for nodes that need to transform data, handle pagination, or support binary files.

---

## ✅ When to Use

- Complex APIs with dynamic behavior
- Pagination, retries, or conditional logic
- Binary data handling
- OAuth2 flows or custom authentication
- When declarative routing isn’t flexible enough

---

## 🧠 Key Features

| Feature            | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `execute()`        | Full control over logic, inputs, and outputs                |
| `getNodeParameter` | Dynamically access user input                               |
| `this.helpers`     | Access built-in utilities (e.g. HTTP requests, OAuth, etc.) |
| `continueOnFail()` | Gracefully handle errors per item                           |
| Modular Dispatch   | Use a `router` to delegate to resource/operation handlers   |

---

## 🧪 Examples

- **Airtop Node**: Uses `execute()` and a central `router` to handle many resources.
- **PowerBI Node**: Dispatches to modular handlers based on `resource` and `operation`.
- **Apify Node**: Uses `execute()` with helpers and hooks for complex workflows.

---

## 🚫 Limitations

- More boilerplate and setup
- Slightly steeper learning curve
- Requires more testing and debugging

---

## 🧬 Summary

| Strengths                       | Limitations                     |
| ------------------------------- | ------------------------------- |
| Full control over logic         | More code to maintain           |
| Supports complex workflows      | Requires deeper n8n knowledge   |
| Great for advanced integrations | Not as beginner-friendly        |
| Modular and scalable            | Less declarative UI integration |

The programmatic pattern is the most powerful and flexible way to build custom n8n nodes. It’s the right choice when you need to go beyond what declarative routing can offer.
