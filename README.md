# @usmanghafoor42/devforge-cli

> A developer utility for scaffolding, linting, and automating boilerplate across npm packages, VS Code extensions, WordPress plugins, and Shopify apps.

[![npm version](https://img.shields.io/npm/v/%40usmanghafoor42%2Fdevforge-cli.svg)](https://www.npmjs.com/package/@usmanghafoor42/devforge-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)

---

## The problem

Every time you start a new project — whether it's an npm package, a VS Code extension, a WordPress plugin, or a Shopify app — you spend hours doing the same things: setting up folder structure, copy-pasting boilerplate, configuring linters, wiring up build scripts, and fixing the things you forgot to rename.

**@usmanghafoor42/devforge-cli eliminates all of that.**

---

## Features

- **Project scaffolding** — generate starter project structures for npm, VS Code, WordPress, and Shopify projects
- **Interactive CLI** — choose a platform and project name through guided prompts
- **Project checks** — inspect whether a directory has a `package.json` and count declared dependencies
- **Portable module support** — ships ESM + CJS builds for modern Node.js tooling
- **TypeScript-first** — fully typed, with `.d.ts` declarations included

---

## Installation

```bash
# Install globally for CLI usage
npm install -g @usmanghafoor42/devforge-cli

# Or use directly with npx (no install needed)
npx @usmanghafoor42/devforge-cli scaffold
```

---

## Usage

### Scaffold a new project

```bash
devforge scaffold
```

Follow the interactive prompts to choose your platform (npm, VS Code, WordPress, Shopify) and project name. devforge generates the full folder structure, config files, and boilerplate instantly.
Follow the interactive prompts to choose your platform and project name. `devforge` creates the starter files for that template in a new directory.

### Scaffold a specific platform

```bash
devforge scaffold --type npm
devforge scaffold --type vscode
devforge scaffold --type wordpress
devforge scaffold --type shopify
```

### Check the current project

```bash
devforge lint
```

This checks whether the current directory contains a `package.json`.

### Summarize dependencies

```bash
devforge audit
```

This reads the current project's `package.json` and reports how many dependencies and devDependencies are declared.

---

## Scaffolded structures

### npm package

```
my-package/
├── src/
│   └── index.ts
├── tests/
│   └── index.test.ts
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── rollup.config.js
├── package.json
└── README.md
```

### VS Code extension

```
my-extension/
├── src/
│   └── extension.ts
├── .vscode/
│   └── extensions.json
├── package.json
├── tsconfig.json
└── README.md
```

### WordPress plugin

```
my-plugin/
├── includes/
│   └── bootstrap.php
├── admin/
│   └── admin.php
├── public/
│   └── public.php
├── plugin.php
├── .phpcs.xml
├── composer.json
└── README.md
```

### Shopify app

```
my-shopify-app/
├── app/
│   ├── routes/
│   │   └── index.tsx
│   └── shopify.server.ts
├── prisma/
│   └── schema.prisma
├── public/
│   └── favicon.svg
├── shopify.app.toml
├── package.json
└── README.md
```

---

## API (programmatic usage)

You can also use devforge-scaffold as a library in your own Node.js tooling:

```typescript
import { scaffold, lint, audit } from 'devforge-scaffold';

// Scaffold a new npm package programmatically
await scaffold({
  type: 'npm',
  name: 'my-package',
  outputDir: './projects'
});

// Run lint check
const results = await lint({ dir: './my-project' });

// Audit dependencies
const report = await audit({ dir: './my-project' });
```

`devforge-scaffold` is currently Node.js-focused. The exported API reads and writes the filesystem, so it is not intended for direct browser execution.

---

## Current scope

The current release focuses on:

- scaffolding starter directories
- checking whether a Node.js project has a `package.json`
- counting declared dependencies in `package.json`

Richer lint setup, dependency compatibility analysis, and template customization can be added in future releases.

---

## Requirements

- Node.js >= 16.0.0
- npm >= 7.0.0

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
git clone https://github.com/UsmanGhafoor42/devforge-cli.git
cd devforge-cli
npm install
npm run dev
```

---

## License

[MIT](./LICENSE) — Usman Ghafoor
