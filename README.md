# forgeflux

> A TypeScript-first CLI for scaffolding modern frontend apps, mobile apps, and backend servers with cleaner starter structures.

[![npm version](https://img.shields.io/npm/v/forgeflux.svg)](https://www.npmjs.com/package/forgeflux)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)

## The problem

Starting a new app still means rebuilding the same folders, config, and architectural baseline over and over. You choose a stack, then spend time shaping directories, wiring TypeScript, separating features, and deciding how auth, ORM, and database setup should fit together.

**forgeflux gives you a cleaner starting point immediately.**

## Features

- Scaffold modern TypeScript starters for frontend, mobile, and server stacks
- Support `nextjs`, `nextjs-gsap`, `react`, `react-gsap`, `react-native-expo`, `nest-js-server`, `express-js-server`, and `angular`
- Ask follow-up questions for stacks that need architecture choices like ORM, database, and OAuth provider
- Generate more professional folder structures instead of a flat starter
- Generate Prisma-ready auth server scaffolds with a starter `User` model, env files, and setup docs
- Support `@/*` import aliases in the generated server templates
- Ship as both ESM and CJS for Node.js tooling use

## Installation

```bash
npm install -g forgeflux
```

Or run it without a global install:

```bash
npx forgeflux scaffold
```

## Usage

The installed package name is `forgeflux`, and the CLI command is currently `devforge`.

### Interactive scaffold

```bash
devforge scaffold
```

### Direct scaffold examples

```bash
devforge scaffold --type nextjs --name my-next-app
devforge scaffold --type nextjs-gsap --name motion-site
devforge scaffold --type react --name dashboard-ui
devforge scaffold --type react-gsap --name campaign-site
devforge scaffold --type angular --name admin-portal
devforge scaffold --type react-native-expo --name mobile-app --database firebase --auth-provider google
devforge scaffold --type nest-js-server --name api-server --orm prisma --database postgresql --auth-provider github
devforge scaffold --type express-js-server --name backend --orm prisma --database postgresql --auth-provider auth0
```

### Other commands

```bash
devforge lint
devforge audit
```

`lint` checks whether the current directory has a `package.json`.

`audit` counts the dependencies and devDependencies declared in `package.json`.

## Supported Templates

### Frontend

- `nextjs`
- `nextjs-gsap`
- `react`
- `react-gsap`
- `angular`

### Mobile

- `react-native-expo`

### Backend

- `nest-js-server`
- `express-js-server`

## Prompted Options

Some scaffold types ask for extra architecture choices.

### ORM choices

- `none`
- `prisma`
- `typeorm`

### Database choices

- `none`
- `postgresql`
- `mongodb`
- `firebase`

### OAuth provider choices

- `none`
- `google`
- `github`
- `auth0`
- `clerk`

## Example Structures

### Next.js

```text
my-next-app/
├── app/
│   ├── api/
│   │   └── health/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
│       └── page-shell.tsx
├── features/
│   └── home/
│       └── hero.tsx
├── lib/
│   └── config/
│       └── site.ts
├── public/
│   └── brand/
│       └── README.md
├── styles/
│   └── globals.css
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Expo

```text
mobile-app/
├── app/
│   ├── _layout.tsx
│   └── index.tsx
├── assets/
│   └── images/
│       └── README.md
├── src/
│   ├── components/
│   │   └── ui/
│   │       └── screen.tsx
│   ├── config/
│   │   └── app.config.ts
│   ├── features/
│   │   └── onboarding/
│   │       └── welcome-card.tsx
│   └── services/
│       └── api/
│           └── client.ts
├── package.json
├── tsconfig.json
└── README.md
```

### NestJS Server

```text
api-server/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── interfaces/
│   │   │   ├── strategies/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   └── auth.service.ts
│   │   └── health/
│   │       └── health.controller.ts
│   ├── common/
│   │   └── services/
│   │       └── email.service.ts
│   ├── modules/
│   │   └── prisma/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   ├── main.ts
│   └── app.module.ts
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### Express Server

```text
backend/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── prisma.ts
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── interfaces/
│   │   └── auth-request.interface.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── routes/
│   │   ├── auth.route.ts
│   │   └── index.route.ts
│   ├── schemas/
│   │   └── auth.schema.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── email.service.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── utils/
│   │   ├── token.util.ts
│   │   └── two-factor.util.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Programmatic Usage

You can also use `forgeflux` as a Node.js library:

```ts
import { scaffold } from 'forgeflux';

await scaffold({
  type: 'express-js-server',
  name: 'api-server',
  orm: 'prisma',
  database: 'postgresql',
  authProvider: 'github'
});
```

The current API is Node.js-focused because it writes files to disk.

## Server Notes

Prisma-based Express and Nest scaffolds now include:

- a starter `User` model in `prisma/schema.prisma`
- `.env.example`
- Prisma generate and migrate scripts
- auth module/service/controller structure
- TypeScript path alias support for `@/*`

## Requirements

- Node.js >= 16
- npm >= 7

## License

[MIT](./LICENSE)
