import { IExecuteFunctions } from "n8n-core"
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow"

export class ProgrammaticExample implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Programmatic Example",
    name: "programmaticExample",
    group: ["transform"],
    version: 1,
    description: "A simple programmatic node example",
    defaults: {
      name: "Programmatic Example",
    },
    inputs: ["main"],
    outputs: ["main"],
    properties: [
      {
        displayName: "Message",
        name: "message",
        type: "string",
        default: "Hello from execute()",
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const returnData: INodeExecutionData[] = []

    for (let i = 0; i < items.length; i++) {
      const message = this.getNodeParameter("message", i) as string
      returnData.push({
        json: {
          original: items[i].json,
          message,
        },
      })
    }

    return [returnData]
  }
}
