# Custom Node Analysis: Apify Integration

This document explores the `Apify` node from the `n8n-nodes-apify` project, which provides a comprehensive and modular integration with the Apify API.

---

## 🧩 Node: `Apify`

This node connects to the Apify platform, enabling users to manage actors, tasks, datasets, and runs.

### Key Features

- **Credentialed API Access**:
  - Uses `apifyApi` credential
  - Sets default `baseURL` to `https://api.apify.com`
  - Sends and receives JSON

- **Modular Architecture**:
  - `Apify.node.ts`: main entry point
  - `Apify.properties.ts`: defines UI and parameters
  - `Apify.methods.ts`: defines logic and execution
  - Resources and operations are split into deeply nested directories:
    ```
    resources/actors/run-actor/index.ts
    resources/actor-tasks/get-task-input/index.ts
    resources/datasets/get-items/index.ts
    ```

- **Extensive API Coverage**:
  - Supports:
    - Actors (create, update, delete, run)
    - Actor Tasks (run, get, update, delete)
    - Datasets (create, get, put items, get items)
    - Actor Runs (get run, get user runs)
  - Includes both synchronous and asynchronous execution modes

- **Hooks and Helpers**:
  - Shared logic in `hooks.ts`, `genericFunctions.ts`, and `methods.ts`
  - Likely supports pre/post-processing and dynamic option loading

---

## 🧠 Teaching Value

This node is a great example of:

- **Deep Modular Design**:
  - Each operation is isolated in its own directory
  - Easy to test, maintain, and extend

- **Scalable API Integration**:
  - Clean separation of UI, logic, and API calls
  - Supports a wide range of endpoints

- **Real-World Complexity**:
  - Demonstrates how to handle a large, multi-resource API
  - Includes both CRUD and execution workflows

---

## 🧪 Patterns Demonstrated

| Pattern             | Description                                    |
| ------------------- | ---------------------------------------------- |
| Modular Dispatch    | Each operation in its own file                 |
| Credentialed Access | Uses API key with default headers              |
| Resource Isolation  | Actors, tasks, datasets, and runs are separate |
| Hook System         | Shared logic for pre/post-processing           |
| Execution Modes     | Supports sync and async task execution         |

---

## 📦 Summary

| Component      | Pattern                         |
| -------------- | ------------------------------- |
| Input          | Resource + operation selector   |
| Processing     | Modular API call dispatch       |
| Output         | JSON from Apify API             |
| Teaching Value | High for large-scale API design |

This is a robust, production-grade node that demonstrates how to build maintainable and extensible integrations for complex APIs in n8n.
