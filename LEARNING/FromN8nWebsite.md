# Learnings from n8n Website Docs

This document summarizes insights from the official n8n documentation on building declarative-style nodes, particularly the tutorial at `docs/integrations/creating-nodes/build/declarative-style-node.md`.

---

## 🧩 Declarative Node Structure

- **Node File (`*.node.ts`)**:
  - Implements `INodeType`
  - Contains a `description` object with metadata and `properties`
  - Uses `routing` blocks to define HTTP requests declaratively

- **Credential File (`*.credentials.ts`)**:
  - Implements `ICredentialType`
  - Uses `authenticate` with `qs` injection for API key auth

- **Codex File (`*.node.json`)**:
  - Metadata for categories, docs, and versioning
  - Required for community nodes

- **Package Metadata (`package.json`)**:
  - Must include `n8n` field linking to built node and credential files
  - Must use `n8n-nodes-` prefix in package name

---

## 🧠 Teaching Highlights

| Concept                 | Description                                                                  |
| ----------------------- | ---------------------------------------------------------------------------- |
| Declarative Routing     | Uses `routing.request` to define method, URL, and query string               |
| Dynamic URL Composition | Uses `={{}}` expressions to interpolate values into URLs and query strings   |
| Optional Fields         | Uses `type: 'collection'` to group optional fields under “Additional Fields” |
| UI Control              | Uses `displayOptions` to conditionally show fields                           |
| Credential Injection    | Uses `authenticate` to inject API key into query string                      |
| Minimal Code            | No `execute()` method needed for simple REST nodes                           |

---

## ✅ Strengths

- Beginner-friendly, step-by-step
- Emphasizes clean UI and declarative config
- Shows full lifecycle: setup, auth, codex, packaging
- Good for simple REST APIs

---

## ❌ Gaps

- Doesn’t show modularization for large nodes
- Doesn’t cover testing/debugging in depth
- Doesn’t compare with programmatic-style nodes
- Doesn’t show how to handle binary data or pagination

---

## 🧪 Comparison to Real Nodes

| Feature               | Declarative Tutorial | Real Nodes (e.g. PowerBI, Apify) |
| --------------------- | -------------------- | -------------------------------- |
| Modularity            | ❌ All-in-one file    | ✅ Deep modular structure         |
| Binary Handling       | ❌ Not covered        | ✅ Common in media nodes          |
| Pagination            | ❌ Not covered        | ✅ Often implemented manually     |
| OAuth2 / Complex Auth | ❌ Not covered        | ✅ Seen in Google, Slack, etc.    |
| Tool Metadata         | ❌ Not mentioned      | ✅ Used in PowerBI, Apify         |

---

## 📦 Summary

The declarative-style tutorial is a great starting point for simple REST integrations. It teaches the basics of node structure, UI design, and declarative HTTP calls. However, for more complex use cases, real-world nodes provide better examples of modularity, advanced auth, and scalable architecture.
