> ℹ️ _Created with AI and there mey be errors._

# Build Custom n8n Nodes Like a Pro 🚀

Welcome to the **n8n Custom Nodes Guide** — your comprehensive resource for building, testing, and publishing custom nodes for [n8n](https://n8n.io), the extendable workflow automation tool.

Whether you're building a quick internal integration or a polished community node, this guide has you covered with real-world examples, API references, and reusable patterns.

![n8n logo](assets/images/n8n.png)

---

## 🧭 What You'll Find Here

- **📚 Public Node API** — Learn how to use the `IExecuteFunctions` context, access parameters, and return data.
- **🧩 Node Patterns** — Choose from Declarative, Programmatic, or Modular Declarative patterns depending on your use case.
- **🔐 Credential Strategies** — Implement secure authentication using API keys, OAuth2, service accounts, and more.
- **🧪 Real-World Examples** — See how production-grade nodes like PowerBI, WebSocket, and Apify are built.
- **🎨 UI & UX** — Customize your node's appearance and behavior in the n8n editor.

---

## ⚡ Quick Start

Here's a minimal but valid n8n node to get you started:

```ts
import { INodeType, INodeTypeDescription, IExecuteFunctions } from 'n8n-workflow'

export class HelloWorldNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Hello World',
    name: 'helloWorld',
    group: ['transform'],
    version: 1,
    description: 'Returns a simple greeting',
    defaults: {
      name: 'Hello World',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [],
  }

  async execute(this: IExecuteFunctions) {
    return [ [{ json: { hello: 'world' } }] ]
  }
}
```

**Ready to dive deeper?**

- [Start with the Public API →](public-api/index.md)
- [Pick a Node Pattern →](patterns/DeclarativePattern/overview.md)
<!-- - [Browse Real Examples →](real-world/GlobalsNode.md) -->

---

## 🎯 Choose Your Path

### 🆕 New to n8n Node Development?
Start with the [Public API Overview](public-api/index.md) to understand the core concepts, then explore the [Declarative Pattern](patterns/DeclarativePattern/overview.md) for the simplest approach.

### 🔧 Building Complex Logic?
Jump to the [Programmatic Pattern](patterns/ProgrammaticPattern/overview.md) for full control, or check out the [Modular Declarative Pattern](patterns/ModularDeclarativePattern/overview.md) for the best of both worlds.

### 🔐 Need Authentication?
Browse our [Credential Patterns](credential-patterns/APIKey.md) to implement secure API connections with OAuth2, service accounts, and more.

### 🧪 Want Real Examples?
Explore our [Real-World Examples](real-world/GlobalsNode.md) to see how production nodes handle complex scenarios like WebSockets, binary data, and external APIs.

---

## 🧠 Why This Guide?

This isn't just a reference — it's a **battle-tested playbook** for building maintainable, scalable, and user-friendly n8n nodes. It's written by a developer (hi, I'm Mrowr 🐾) who's been deep in the node ecosystem and wants to make your life easier.

**What makes this different:**

- ✅ **Real-world focus** — Examples from actual production nodes
- ✅ **Pattern-driven** — Clear architectural guidance for different use cases
- ✅ **Comprehensive API docs** — Every helper, context, and interface explained
- ✅ **Best practices** — Error handling, testing, and UX considerations
- ✅ **Copy-paste ready** — Code you can actually use

---

## 🛠️ Ready to Build?

Use the navigation sidebar to explore, or jump straight to these popular sections:

- [**Helpers Overview**](public-api/helpers/index.md) — HTTP requests, binary data, filesystem operations
- [**Execution Contexts**](public-api/execution-contexts/IExecuteFunctions.md) — Understanding the `this` context in your nodes
- [**Parameter Access**](public-api/parameters/getNodeParameter.md) — Reading user inputs and configuration
- [**Error Handling**](advanced/ErrorHandling.md) — Graceful failures and user-friendly messages
- [**UI & UX**](ui-ux/DisplayOptions.md) — Making your nodes intuitive and polished

---

## 🚀 What's Next?

Once you've built your first node, consider:

- Publishing to the [n8n Community Nodes](https://www.npmjs.com/search?q=n8n-nodes-) registry
- Contributing examples back to this guide
- Joining the [n8n Community](https://community.n8n.io/) to share your creations

**Happy building!** 🎉
