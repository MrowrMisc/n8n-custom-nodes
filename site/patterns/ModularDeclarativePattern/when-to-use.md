# When to Use the Modular Declarative Pattern

This pattern is ideal when you want the simplicity of declarative routing but need to scale across many operations or resources.

Use this pattern when:
- You have many endpoints or operations to organize
- You want to split logic into separate files for maintainability
- You want to reuse shared logic across operations
- You want to dynamically load options or metadata
- You want to use `hooks` or `loadOptionsMethod` to enhance declarative behavior

Avoid this pattern if:
- You only have one or two operations
- You don’t need dynamic behavior or modularity

## Modular File Structure Example

Here's how to organize a large API node with many operations:

**File Structure:**
```
MyApiNode/
├── MyApiNode.node.ts          # Main node class
├── description.ts             # Node description
├── methods.ts                 # Load options methods
├── operations/
│   ├── user/
│   │   ├── create.ts         # User creation logic
│   │   ├── update.ts         # User update logic
│   │   └── index.ts          # User operations export
│   ├── project/
│   │   ├── create.ts         # Project creation logic
│   │   ├── list.ts           # Project listing logic
│   │   └── index.ts          # Project operations export
│   └── index.ts              # All operations export
└── utils/
    ├── apiHelpers.ts         # Shared API utilities
    └── validation.ts         # Shared validation logic
```

**operations/user/create.ts:**
```ts
import { INodeProperties } from 'n8n-workflow';

export const userCreateDescription: INodeProperties[] = [
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['user'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'Name of the user to create',
  },
  {
    displayName: 'Email',
    name: 'email',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['user'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'Email address of the user',
  },
];

export const userCreateRouting = {
  request: {
    method: 'POST' as const,
    url: '/users',
    body: {
      name: '={{ $parameter.name }}',
      email: '={{ $parameter.email }}',
    },
  },
};
```

**operations/index.ts:**
```ts
import { userCreateDescription, userCreateRouting } from './user/create';
import { userUpdateDescription, userUpdateRouting } from './user/update';
import { projectCreateDescription, projectCreateRouting } from './project/create';
import { projectListDescription, projectListRouting } from './project/list';

export const operationDescriptions = [
  ...userCreateDescription,
  ...userUpdateDescription,
  ...projectCreateDescription,
  ...projectListDescription,
];

export const operationRouting = {
  'user:create': userCreateRouting,
  'user:update': userUpdateRouting,
  'project:create': projectCreateRouting,
  'project:list': projectListRouting,
};
```

This modular approach makes it easy to maintain large nodes with dozens of operations while keeping each operation's logic isolated and reusable.
