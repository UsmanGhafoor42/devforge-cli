# forgeflux VS Code Extension

> Run `forgeflux` scaffolds, lint checks, and dependency audits directly from VS Code.

## What It Does

- Launches `npx forgeflux scaffold` from the Command Palette
- Supports the current forgeflux project types:
  - `nextjs`
  - `nextjs-gsap`
  - `react`
  - `react-gsap`
  - `react-native-expo`
  - `nest-js-server`
  - `express-js-server`
  - `angular`
- Prompts for ORM, database, and OAuth provider when the selected stack needs them
- Runs `forgeflux lint` and `forgeflux audit` in the active workspace
- Shows inline diagnostics for common `package.json` issues

## Commands

- `forgeflux: Scaffold New Project`
- `forgeflux: Run Lint Check`
- `forgeflux: Audit Dependencies`

## Requirements

- VS Code `^1.85.0`
- Node.js `>=16`
- `forgeflux` available through `npx`

## Notes

The extension currently shells out to the published CLI, so it stays aligned with the latest scaffold behavior from the npm package.

## License

[MIT](../LICENSE)
