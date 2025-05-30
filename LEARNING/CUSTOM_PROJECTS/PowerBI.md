# Custom Node Analysis: Power BI Integration

This document explores the `PowerBI` node from the `n8n-nodes-powerbi` project, which provides a modular and scalable integration with the Power BI REST API.

---

## 🧩 Node: `PowerBI`

This node supports multiple Power BI resources and operations, dynamically dispatching to modular handlers.

### Key Features

- **Supported Resources**:
  - `admin`, `dashboard`, `dataset`, `group`, `report`

- **Dynamic Dispatch**:
  - Uses a `resources` object to map `resource` + `operation` to handler functions
  - Each operation is implemented in its own file under `resources/<resource>/<operation>.ts`

- **Dynamic Option Loading**:
  - Implements `loadOptions` methods for dropdowns (e.g. workspaces, datasets, reports)

- **Credentialed API Access**:
  - Uses a `powerBI` credential
  - Sets default `baseURL` and headers

- **Tool Metadata**:
  - Sets `usableAsTool = true`
  - Defines `codex` metadata for AI integration

- **Localized Labels**:
  - Some UI labels and descriptions are in Portuguese (e.g. `Obter Informações de Workspaces`)

- **Error Handling**:
  - Supports `continueOnFail()` for partial success

---

## 🧠 Teaching Value

This node is a great example of:

- **Modular Design**:
  - Keeps each operation isolated and testable
  - Easy to extend with new endpoints

- **Dynamic Execution**:
  - Uses runtime dispatch to route to the correct handler

- **Scalable Architecture**:
  - Clean separation of concerns between UI, logic, and API calls

- **Tooling Support**:
  - Prepares the node for AI tooling and Codex integration

---

## 🧪 Patterns Demonstrated

| Pattern             | Description                                            |
| ------------------- | ------------------------------------------------------ |
| Modular Dispatch    | Maps resource/operation to handler functions           |
| Dynamic Options     | Loads dropdown values from API                         |
| Credentialed Access | Uses OAuth2 or token-based auth                        |
| Tool Metadata       | Enables AI integration with `codex` and `usableAsTool` |
| Error Resilience    | Supports `continueOnFail()`                            |

---

## 📦 Summary

| Component      | Pattern                       |
| -------------- | ----------------------------- |
| Input          | Resource + operation selector |
| Processing     | Modular API call dispatch     |
| Output         | JSON from Power BI API        |
| Teaching Value | High for scalable API design  |

This is a robust, enterprise-grade node that demonstrates how to build maintainable and extensible API integrations in n8n.
