import { ICredentialType, INodeProperties } from "n8n-workflow"

export class ModularDeclarativeExampleApi implements ICredentialType {
  name = "modularDeclarativeExampleApi"
  displayName = "Modular Declarative Example API"
  documentationUrl = "https://example.com"
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
