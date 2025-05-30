import { ICredentialType, INodeProperties } from "n8n-workflow"

export class DeclarativeExampleApi implements ICredentialType {
  name = "declarativeExampleApi"
  displayName = "Declarative Example API"
  documentationUrl = "https://jsonplaceholder.typicode.com"
  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      default: "",
    },
  ]
  authenticate = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "Bearer {{$credentials.apiKey}}",
      },
    },
  }
}
