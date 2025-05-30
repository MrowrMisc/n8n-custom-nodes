# Declarative Pattern

The declarative pattern in n8n allows you to define node behavior entirely through metadata—no `execute()` method required. It’s ideal for simple REST APIs and CRUD-style operations.

---

## 🧩 What It Is

- Node behavior is described using `description`, `properties`, and `routing` blocks.
- HTTP requests are defined declaratively using `routing.request`.
- No imperative logic or custom code is needed.

---

## ✅ When to Use

- Simple REST APIs
- CRUD operations
- Prototyping or teaching
- When you don’t need to transform data or handle edge cases

---

## 🧠 Key Features

| Feature              | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `routing.request`    | Defines HTTP method, URL, headers, and query string     |
| `type: 'options'`    | Creates dropdowns for selecting operations or resources |
| `type: 'collection'` | Groups optional fields under “Additional Fields”        |
| `displayOptions`     | Controls conditional visibility of fields               |
| `authenticate`       | Injects credentials (e.g. API key via query string)     |
| No `execute()`       | All behavior is declarative—no imperative logic         |

---

## 🧪 Examples

- **NASA APOD Tutorial**: A simple node that fetches astronomy pictures and Mars rover photos.
- **Brevo Node**: Official n8n node that uses modular declarative fields and operations.

---

## 🚫 Limitations

- No custom logic or transformation
- Hard to handle pagination, binary data, or conditional flows
- Debugging is less transparent
- Not ideal for complex APIs or dynamic behavior

---

## 🧬 Summary

| Strengths                  | Limitations                   |
| -------------------------- | ----------------------------- |
| Easy to build and maintain | No logic layer                |
| Great for onboarding       | Limited control               |
| Clean UI integration       | Harder to debug               |
| Fast to prototype          | Not suitable for complex APIs |

The declarative pattern is a powerful tool for simple use cases, and a great way to get started with custom n8n nodes.
