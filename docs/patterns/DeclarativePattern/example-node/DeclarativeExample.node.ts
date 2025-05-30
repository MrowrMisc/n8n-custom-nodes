import { INodeType, INodeTypeDescription } from "n8n-workflow"

export class DeclarativeExample implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Declarative Example",
    name: "declarativeExample",
    group: ["transform"],
    version: 1,
    description: "A simple declarative node example",
    defaults: {
      name: "Declarative Example",
    },
    inputs: ["main"],
    outputs: ["main"],
    properties: [
      {
        displayName: "User ID",
        name: "userId",
        type: "string",
        default: "",
      },
      {
        displayName: "Include Details",
        name: "includeDetails",
        type: "boolean",
        default: false,
      },
    ],
    requestDefaults: {
      baseURL: "https://jsonplaceholder.typicode.com",
    },
    routing: {
      request: {
        method: "GET",
        url: '=/users/{{$parameter["userId"]}}',
        qs: {
          details: '={{$parameter["includeDetails"]}}',
        },
      },
    },
  }
}
