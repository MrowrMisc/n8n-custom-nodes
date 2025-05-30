# WebSocket Server Node

This node spins up a WebSocket server inside n8n and allows external clients to send messages into a workflow.

## Key Features
- Starts a WebSocket server on a configurable port
- Broadcasts messages to all connected clients
- Emits incoming messages as workflow items

## Implementation Highlights
- Uses `ws` package to create a server
- Stores server instance in a global map
- Cleans up on workflow deactivation

## Use Cases
- Real-time dashboards
- External event ingestion
- Local dev tools integration

## Teaching Value
- Shows how to manage long-lived server state
- Demonstrates use of `workflow.on('close')` for cleanup
- Great example of a trigger node with custom transport

## Complete WebSocket Server Implementation

Here's a full WebSocket server node that manages connections and emits messages:

```ts
import {
  ITriggerFunctions,
  INodeType,
  INodeTypeDescription,
  ITriggerResponse,
  NodeApiError,
} from 'n8n-workflow';
import { Server as WebSocketServer } from 'ws';
import { createServer } from 'http';

// Global map to store active WebSocket servers
const activeServers = new Map<string, WebSocketServer>();

export class WebSocketServerTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'WebSocket Server',
    name: 'webSocketServer',
    icon: 'file:websocket.svg',
    group: ['trigger'],
    version: 1,
    description: 'Start a WebSocket server and emit incoming messages',
    defaults: {
      name: 'WebSocket Server',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Port',
        name: 'port',
        type: 'number',
        default: 8080,
        required: true,
        description: 'Port to run the WebSocket server on',
      },
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: '/',
        description: 'WebSocket endpoint path',
      },
      {
        displayName: 'Max Connections',
        name: 'maxConnections',
        type: 'number',
        default: 100,
        description: 'Maximum number of concurrent connections',
      },
      {
        displayName: 'Enable Heartbeat',
        name: 'enableHeartbeat',
        type: 'boolean',
        default: true,
        description: 'Send periodic ping messages to keep connections alive',
      },
      {
        displayName: 'Heartbeat Interval (seconds)',
        name: 'heartbeatInterval',
        type: 'number',
        default: 30,
        displayOptions: {
          show: {
            enableHeartbeat: [true],
          },
        },
        description: 'How often to send heartbeat pings',
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const port = this.getNodeParameter('port') as number;
    const path = this.getNodeParameter('path') as string;
    const maxConnections = this.getNodeParameter('maxConnections') as number;
    const enableHeartbeat = this.getNodeParameter('enableHeartbeat') as boolean;
    const heartbeatInterval = this.getNodeParameter('heartbeatInterval') as number;

    const workflowId = this.getWorkflow().id;
    const nodeId = this.getNode().id;
    const serverKey = `${workflowId}-${nodeId}`;

    // Check if server is already running
    if (activeServers.has(serverKey)) {
      throw new NodeApiError(this.getNode(), {
        message: 'WebSocket server already running',
        description: `A WebSocket server is already running on port ${port}`,
      });
    }

    try {
      // Create HTTP server for WebSocket upgrade
      const httpServer = createServer();
      
      // Create WebSocket server
      const wss = new WebSocketServer({
        server: httpServer,
        path,
        maxPayload: 1024 * 1024, // 1MB max message size
      });

      // Store server reference
      activeServers.set(serverKey, wss);

      // Track connections
      const connections = new Set();
      let heartbeatTimer: NodeJS.Timeout | null = null;

      // Handle new connections
      wss.on('connection', (ws, request) => {
        // Check connection limit
        if (connections.size >= maxConnections) {
          ws.close(1013, 'Server at capacity');
          return;
        }

        connections.add(ws);
        
        console.log(`WebSocket client connected. Total: ${connections.size}`);
        
        // Add connection metadata
        (ws as any).isAlive = true;
        (ws as any).clientIp = request.socket.remoteAddress;
        (ws as any).userAgent = request.headers['user-agent'];
        (ws as any).connectedAt = new Date();

        // Handle incoming messages
        ws.on('message', (data) => {
          try {
            let message: any;
            
            // Try to parse as JSON, fallback to string
            try {
              message = JSON.parse(data.toString());
            } catch {
              message = data.toString();
            }

            // Emit message to workflow
            this.emit([
              {
                json: {
                  message,
                  metadata: {
                    clientIp: (ws as any).clientIp,
                    userAgent: (ws as any).userAgent,
                    connectedAt: (ws as any).connectedAt,
                    timestamp: new Date().toISOString(),
                  },
                },
              },
            ]);
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        });

        // Handle connection close
        ws.on('close', (code, reason) => {
          connections.delete(ws);
          console.log(`WebSocket client disconnected. Code: ${code}, Reason: ${reason}. Total: ${connections.size}`);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          connections.delete(ws);
        });

        // Handle pong responses for heartbeat
        ws.on('pong', () => {
          (ws as any).isAlive = true;
        });

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'welcome',
          message: 'Connected to n8n WebSocket server',
          timestamp: new Date().toISOString(),
        }));
      });

      // Setup heartbeat if enabled
      if (enableHeartbeat) {
        heartbeatTimer = setInterval(() => {
          wss.clients.forEach((ws) => {
            if ((ws as any).isAlive === false) {
              ws.terminate();
              connections.delete(ws);
              return;
            }
            
            (ws as any).isAlive = false;
            ws.ping();
          });
        }, heartbeatInterval * 1000);
      }

      // Start HTTP server
      httpServer.listen(port, () => {
        console.log(`WebSocket server started on port ${port}${path}`);
      });

      // Cleanup function
      const closeFunction = async () => {
        console.log('Closing WebSocket server...');
        
        // Clear heartbeat timer
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }

        // Close all connections
        wss.clients.forEach((ws) => {
          ws.close(1001, 'Server shutting down');
        });

        // Close server
        wss.close();
        httpServer.close();
        
        // Remove from active servers
        activeServers.delete(serverKey);
        
        console.log('WebSocket server closed');
      };

      // Register cleanup on workflow close
      this.getWorkflow().on('close', closeFunction);

      return {
        closeFunction,
        // Provide server info for manual operations
        manualTriggerFunction: async () => {
          return {
            json: {
              serverInfo: {
                port,
                path,
                activeConnections: connections.size,
                maxConnections,
                heartbeatEnabled: enableHeartbeat,
                serverUrl: `ws://localhost:${port}${path}`,
              },
            },
          };
        },
      };
      
    } catch (error) {
      // Cleanup on error
      activeServers.delete(serverKey);
      
      throw new NodeApiError(this.getNode(), error, {
        message: 'Failed to start WebSocket server',
        description: error.message,
      });
    }
  }
}
```

**Client Connection Example:**
```javascript
// JavaScript client example
const ws = new WebSocket('ws://localhost:8080/');

ws.onopen = function() {
  console.log('Connected to n8n WebSocket server');
  
  // Send a message
  ws.send(JSON.stringify({
    type: 'user_action',
    action: 'button_click',
    data: { buttonId: 'submit', userId: '12345' }
  }));
};

ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onclose = function(event) {
  console.log('Connection closed:', event.code, event.reason);
};

ws.onerror = function(error) {
  console.error('WebSocket error:', error);
};
```

**Python Client Example:**
```python
import asyncio
import websockets
import json

async def client():
    uri = "ws://localhost:8080/"
    
    async with websockets.connect(uri) as websocket:
        # Send a message
        message = {
            "type": "sensor_data",
            "temperature": 23.5,
            "humidity": 65.2,
            "timestamp": "2023-12-01T10:30:00Z"
        }
        
        await websocket.send(json.dumps(message))
        
        # Listen for responses
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

# Run the client
asyncio.run(client())
```

This WebSocket server node demonstrates:
- **Server lifecycle management**: Starting, tracking, and cleaning up servers
- **Connection handling**: Managing multiple clients with limits
- **Message processing**: Parsing JSON and emitting to workflows
- **Heartbeat mechanism**: Keeping connections alive
- **Error handling**: Graceful error management and cleanup
- **Metadata tracking**: Client information and connection details

Perfect for real-time applications, IoT data ingestion, and interactive dashboards!
