import type { SidebarsConfig } from "@docusaurus/plugin-content-docs"

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: "category",
      label: "📚 Public Node API",
      collapsed: false,
      items: [
        "public-api/index",
        {
          type: "category",
          label: "Execution Contexts",
          items: [
            "public-api/execution-contexts/IExecuteFunctions",
            "public-api/execution-contexts/IExecuteSingleFunctions",
            "public-api/execution-contexts/ILoadOptionsFunctions",
            "public-api/execution-contexts/IPollFunctions",
            "public-api/execution-contexts/ITriggerFunctions",
            "public-api/execution-contexts/IWebhookFunctions",
            "public-api/execution-contexts/IHookFunctions",
          ],
        },
        {
          type: "category",
          label: "Helpers",
          items: [
            "public-api/helpers/index",
            "public-api/helpers/binary",
            "public-api/helpers/http",
            "public-api/helpers/filesystem",
            "public-api/helpers/deduplication",
            "public-api/helpers/base",
          ],
        },
        {
          type: "category",
          label: "Parameter Access",
          items: [
            "public-api/parameters/getNodeParameter",
            "public-api/parameters/evaluateExpression",
            "public-api/parameters/getCurrentNodeParameter",
          ],
        },
        {
          type: "category",
          label: "Workflow & Execution",
          items: [
            "public-api/workflow/getWorkflow",
            "public-api/workflow/getWorkflowStaticData",
            "public-api/workflow/executeWorkflow",
            "public-api/workflow/putExecutionToWait",
          ],
        },
        {
          type: "category",
          label: "Advanced",
          items: [
            "public-api/advanced/startJob",
            "public-api/advanced/logAiEvent",
            "public-api/advanced/sendMessageToUI",
          ],
        },
        {
          type: "category",
          label: "Reference",
          items: [
            "public-api/reference/types",
            "public-api/reference/interfaces",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "🧩 Patterns",
      items: [
        {
          type: "category",
          label: "Declarative Pattern",
          items: [
            "patterns/DeclarativePattern/overview",
            "patterns/DeclarativePattern/when-to-use",
            "patterns/DeclarativePattern/key-features",
            "patterns/DeclarativePattern/limitations",
            "patterns/DeclarativePattern/summary",
          ],
        },
        {
          type: "category",
          label: "Programmatic Pattern",
          items: [
            "patterns/ProgrammaticPattern/overview",
            "patterns/ProgrammaticPattern/when-to-use",
            "patterns/ProgrammaticPattern/key-features",
            "patterns/ProgrammaticPattern/limitations",
            "patterns/ProgrammaticPattern/summary",
          ],
        },
        {
          type: "category",
          label: "Modular Declarative Pattern",
          items: [
            "patterns/ModularDeclarativePattern/overview",
            "patterns/ModularDeclarativePattern/when-to-use",
            "patterns/ModularDeclarativePattern/key-features",
            "patterns/ModularDeclarativePattern/limitations",
            "patterns/ModularDeclarativePattern/summary",
          ],
        },
        {
          type: "category",
          label: "Other Patterns",
          items: [
            "patterns/OtherPatterns/TriggerNodes",
            "patterns/OtherPatterns/BinaryNodes",
            "patterns/OtherPatterns/Pagination",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "🔐 Credential Patterns",
      items: [
        "credential-patterns/APIKey",
        "credential-patterns/OAuth2",
        "credential-patterns/ServiceAccount",
        "credential-patterns/ManualInjection",
        "credential-patterns/CredentialTesting",
      ],
    },
    {
      type: "category",
      label: "🧪 Real World Examples",
      items: [
        "real-world/GlobalsNode",
        "real-world/WebSocketServerNode",
        "real-world/PowerBINode",
        "real-world/ApifyNode",
        "real-world/QrCodeNode",
        "real-world/AirtopNode",
      ],
    },
    {
      type: "category",
      label: "🎨 UI & UX",
      items: [
        "ui-ux/DisplayOptions",
        "ui-ux/CollectionsAndAdditionalFields",
        "ui-ux/DynamicOptions",
        "ui-ux/CodexMetadata",
      ],
    },
  ],
}

export default sidebars
