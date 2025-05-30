import { ICredentialType, INodeProperties } from "n8n-workflow"

export class ProgrammaticExampleApi implements ICredentialType {
  name = "programmaticExampleApi"
  displayName = "Programmatic Example API"
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
