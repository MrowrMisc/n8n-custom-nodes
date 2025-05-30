import { INodeType, INodeTypeDescription } from "n8n-workflow"

export class ModularDeclarativeExample implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Modular Declarative Example",
    name: "modularDeclarativeExample",
    group: ["transform"],
    version: 1,
    description: "A modular declarative node example",
    defaults: {
      name: "Modular Declarative Example",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "modularDeclarativeExampleApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        options: [
          { name: "User", value: "user" },
          { name: "Post", value: "post" },
        ],
        default: "user",
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        displayOptions: {
          show: {
            resource: ["user"],
          },
        },
        options: [{ name: "Get All", value: "getAll" }],
        default: "getAll",
      },
    ],
    requestDefaults: {
      baseURL: "https://jsonplaceholder.typicode.com",
    },
    routing: {
      request: {
        method: "GET",
        url: "=/users",
      },
    },
  }
}
