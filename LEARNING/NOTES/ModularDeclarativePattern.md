# Modular Declarative Pattern

The modular declarative pattern combines the simplicity of declarative nodes with the scalability of modular architecture. It’s ideal for large declarative nodes that need to stay maintainable and organized.

---

## 🧩 What It Is

- A declarative node that splits its `properties` and `operations` into separate files.
- Each resource or operation is defined in its own module and imported into the main node.
- Still uses `routing.request` blocks—no `execute()` method.

---

## ✅ When to Use

- Declarative node with many operations or resources
- You want to keep files small and focused
- You’re using code generation or shared logic (e.g. hooks, helpers)

---

## 🧠 Key Features

| Feature                  | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `routing.request`        | Declarative HTTP request definition                   |
| Modular `*.operation.ts` | Each operation in its own file                        |
| Shared `hooks.ts`        | Inject shared logic into options or properties        |
| `runHooks()` pattern     | Dynamically modify or enhance declarative definitions |
| No `execute()`           | Still declarative—no imperative logic                 |

---

## 🧪 Examples

- **Apify Node**: Uses `runHooks()` and codegen to modularize declarative operations.
- **Brevo Node**: Imports `attributeFields`, `emailOperations`, etc. from separate files.

---

## 🚫 Limitations

- Still limited by what declarative routing can express
- Requires more tooling or conventions to manage modules
- Debugging can be harder if logic is injected dynamically

---

## 🧬 Summary

| Strengths                        | Limitations                          |
| -------------------------------- | ------------------------------------ |
| Clean separation of concerns     | Still limited to declarative logic   |
| Scales well with many operations | Requires more setup and tooling      |
| Great for codegen and reuse      | Harder to debug dynamic hooks        |
| Declarative + maintainable       | Not suitable for complex logic flows |

The modular declarative pattern is a powerful middle ground—perfect for teams that want the clarity of declarative nodes with the structure of a real codebase.
