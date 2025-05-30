# Custom Node Analysis: WebSocket Trigger & Registry

This document explores the architecture of the `n8n-nodes-websocket-standalone` package, which introduces a WebSocket server into n8n using a trigger node and a global registry.

---

## 🧩 Node: `WebSocketTrigger`

This node starts a WebSocket server and emits messages into the workflow when received.

### Key Features

- **Dynamic Server Creation**: Starts a WebSocket server on a specified port and path.
- **Global Context**: Uses `global.websocketExecutionContext` to persist server and listener state.
- **Execution-Aware**: Tracks execution ID and node ID to manage lifecycle.
- **Listener Management**: Cleans up old listeners and registers new ones per execution.
- **Soft vs Hard Close**: Differentiates between workflow edits and runtime executions to decide whether to keep clients alive.

### Output

Each message received is emitted with metadata:

```json
{
  "message": "...",
  "serverId": "ws-5680",
  "clientId": "abc123",
  "executionId": "...",
  "contextInfo": { "port": 5680, "path": "/ws", ... }
}
```

---

## 🧠 Registry: `WebSocketRegistry`

A singleton class that manages all WebSocket servers and clients.

### Responsibilities

- **Server Lifecycle**:
  - `getOrCreateServer()`: Creates or reuses a server.
  - `closeServer()`: Supports soft and hard shutdowns.
- **Client Management**:
  - Tracks clients per server.
  - Sends periodic pings to keep connections alive.
  - Handles client disconnects and errors.
- **Execution Tracking**:
  - Registers and unregisters active executions.
  - Prevents premature shutdown if other executions are still using the server.
- **Persistence**:
  - Saves server metadata to a temp file (`n8n-websocket-registry.json`) for recovery.

### Broadcast Support

```ts
broadcastToServer(serverId, message)
```

Sends a message to all connected clients on a given server.

---

## 🧪 Teaching Value

This project demonstrates:

- **Global State in n8n**: Using `global` to persist server state across executions.
- **Custom Server Management**: Full lifecycle control of WebSocket servers.
- **Execution-Aware Cleanup**: Prevents race conditions and premature shutdowns.
- **Client Health Checks**: Uses ping/pong to detect dead connections.
- **Soft Close Pattern**: Keeps servers alive between executions for response coordination.

---

## 📦 Summary

| Component          | Pattern                                 |
| ------------------ | --------------------------------------- |
| Trigger Node       | Starts WebSocket server, emits messages |
| Registry           | Manages server/client lifecycle         |
| Global Context     | Stores server state across executions   |
| Execution Tracking | Prevents premature shutdown             |
| Broadcast Support  | Sends messages to all clients           |

This is a powerful and advanced pattern for integrating real-time communication into n8n workflows.
