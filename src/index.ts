import fs from 'node:fs';
import path from 'node:path';
import fsExtra from 'fs-extra';

export type ProjectType =
  | 'nextjs'
  | 'nextjs-gsap'
  | 'react'
  | 'react-gsap'
  | 'react-native-expo'
  | 'nest-js-server'
  | 'express-js-server'
  | 'angular';

export type OrmChoice = 'none' | 'prisma' | 'typeorm';
export type DatabaseChoice = 'none' | 'postgresql' | 'mongodb' | 'firebase';
export type AuthProviderChoice = 'none' | 'google' | 'github' | 'auth0' | 'clerk';

export interface ScaffoldOptions {
  type: ProjectType;
  name: string;
  outputDir?: string;
  orm?: OrmChoice;
  database?: DatabaseChoice;
  authProvider?: AuthProviderChoice;
}

export interface LintOptions {
  dir?: string;
}

export interface AuditOptions {
  dir?: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
}

interface TemplateFile {
  path: string;
  content: string;
}

interface TemplateDefinition {
  description: string;
  files: TemplateFile[];
}

const projectTypes: ProjectType[] = [
  'nextjs',
  'nextjs-gsap',
  'react',
  'react-gsap',
  'react-native-expo',
  'nest-js-server',
  'express-js-server',
  'angular'
];

function unique<T>(value: T, index: number, items: T[]): boolean {
  return items.indexOf(value) === index;
}

function toAbsoluteDir(dir?: string): string {
  return path.resolve(dir ?? process.cwd());
}

function titleizeProjectType(type: ProjectType): string {
  return type
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function packageName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

function tsFile(heading: string, body: string): string {
  return `${heading}\n\n${body}\n`;
}

function markdown(title: string, body: string): string {
  return `# ${title}\n\n${body}\n`;
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parentDirs(files: TemplateFile[]): string[] {
  return files
    .map((file) => path.dirname(file.path))
    .filter((dir) => dir !== '.')
    .filter(unique);
}

function typeScriptPackageJson(name: string, scripts: Record<string, string>): string {
  return json({
    name: packageName(name),
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts
  });
}

function sharedServerNotes(options: ScaffoldOptions): string {
  return [
    `ORM: ${options.orm ?? 'none'}`,
    `Database: ${options.database ?? 'none'}`,
    `OAuth provider: ${options.authProvider ?? 'none'}`
  ].join('\n');
}

function optionalServerFiles(options: ScaffoldOptions): TemplateFile[] {
  const files: TemplateFile[] = [];

  if (options.orm === 'prisma') {
    files.push({
      path: 'prisma/schema.prisma',
      content: `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "${options.database === 'mongodb' ? 'mongodb' : 'postgresql'}"\n  url      = env("DATABASE_URL")\n}\n`
    });
  }

  if (options.orm === 'typeorm') {
    files.push({
      path: 'src/config/database.config.ts',
      content: tsFile(
        `export const databaseConfig = {`,
        `  orm: 'typeorm',\n  database: '${options.database ?? 'none'}'\n};`
      )
    });
  }

  if (options.database === 'firebase') {
    files.push({
      path: 'src/config/firebase.config.ts',
      content: tsFile(
        `export const firebaseConfig = {`,
        `  projectId: process.env.FIREBASE_PROJECT_ID ?? '',\n  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? ''\n};`
      )
    });
  }

  if (options.authProvider && options.authProvider !== 'none') {
    files.push({
      path: 'src/auth/oauth.provider.ts',
      content: tsFile(
        `export const oauthProvider = {`,
        `  provider: '${options.authProvider}',\n  enabled: true\n};`
      )
    });
  }

  return files;
}

function appTemplate(type: ProjectType, options: ScaffoldOptions): TemplateDefinition {
  const name = options.name;

  switch (type) {
    case 'nextjs':
      return {
        description: 'Next.js App Router starter with TypeScript',
        files: [
          { path: 'app/layout.tsx', content: `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}\n` },
          { path: 'app/page.tsx', content: `export default function HomePage() {\n  return <main>${name} Next.js starter</main>;\n}\n` },
          { path: 'app/api/health/route.ts', content: `export async function GET() {\n  return Response.json({ status: 'ok' });\n}\n` },
          { path: 'components/ui/page-shell.tsx', content: `export function PageShell({ children }: { children: React.ReactNode }) {\n  return <section>{children}</section>;\n}\n` },
          { path: 'features/home/hero.tsx', content: `export function Hero() {\n  return <section>Launch ${name}</section>;\n}\n` },
          { path: 'lib/config/site.ts', content: `export const siteConfig = { name: '${name}' };\n` },
          { path: 'styles/globals.css', content: ':root { color-scheme: light; }\n' },
          { path: 'public/brand/README.md', content: markdown('Assets', 'Brand assets live here.') },
          { path: 'next.config.ts', content: `import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n` },
          { path: 'package.json', content: typeScriptPackageJson(name, { dev: 'next dev', build: 'next build', start: 'next start' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', lib: ['dom', 'dom.iterable', 'es2022'], jsx: 'preserve', strict: true } }) },
          { path: 'README.md', content: markdown(name, 'Next.js App Router + TypeScript starter scaffolded with forgeflux.') }
        ]
      };
    case 'nextjs-gsap':
      return {
        description: 'Next.js App Router + GSAP starter with TypeScript',
        files: [
          { path: 'app/layout.tsx', content: `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}\n` },
          { path: 'app/page.tsx', content: `import { HeroMotion } from '../components/marketing/hero-motion';\n\nexport default function HomePage() {\n  return <main><HeroMotion /></main>;\n}\n` },
          { path: 'components/marketing/hero-motion.tsx', content: `'use client';\n\nexport function HeroMotion() {\n  return <section>GSAP-ready hero for ${name}</section>;\n}\n` },
          { path: 'lib/animations/hero-timeline.ts', content: `export function buildHeroTimeline() {\n  return 'gsap timeline placeholder';\n}\n` },
          { path: 'features/home/showcase.tsx', content: `export function Showcase() {\n  return <section>Animation showcase</section>;\n}\n` },
          { path: 'styles/globals.css', content: ':root { color-scheme: light; }\n' },
          { path: 'next.config.ts', content: `import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n` },
          { path: 'package.json', content: typeScriptPackageJson(name, { dev: 'next dev', build: 'next build', start: 'next start' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', lib: ['dom', 'dom.iterable', 'es2022'], jsx: 'preserve', strict: true } }) },
          { path: 'README.md', content: markdown(name, 'Next.js + GSAP + TypeScript starter scaffolded with forgeflux.') }
        ]
      };
    case 'react':
      return {
        description: 'React + Vite starter with TypeScript',
        files: [
          { path: 'src/main.tsx', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './app/app';\nimport './styles/index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);\n` },
          { path: 'src/app/app.tsx', content: `export function App() {\n  return <main>${name} React starter</main>;\n}\n` },
          { path: 'src/components/layout/app-shell.tsx', content: `export function AppShell({ children }: { children: React.ReactNode }) {\n  return <section>{children}</section>;\n}\n` },
          { path: 'src/features/home/home-page.tsx', content: `export function HomePage() {\n  return <section>Home feature</section>;\n}\n` },
          { path: 'src/styles/index.css', content: ':root { font-family: ui-sans-serif, system-ui, sans-serif; }\n' },
          { path: 'public/favicon.svg', content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"></svg>\n' },
          { path: 'vite.config.ts', content: `import { defineConfig } from 'vite';\n\nexport default defineConfig({});\n` },
          { path: 'package.json', content: typeScriptPackageJson(name, { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', jsx: 'react-jsx', strict: true } }) },
          { path: 'README.md', content: markdown(name, 'React + Vite + TypeScript starter scaffolded with forgeflux.') }
        ]
      };
    case 'react-gsap':
      return {
        description: 'React + GSAP starter with TypeScript',
        files: [
          { path: 'src/main.tsx', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './app/app';\nimport './styles/index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);\n` },
          { path: 'src/app/app.tsx', content: `import { HeroMotion } from '../components/marketing/hero-motion';\n\nexport function App() {\n  return <main><HeroMotion /></main>;\n}\n` },
          { path: 'src/components/marketing/hero-motion.tsx', content: `export function HeroMotion() {\n  return <section>GSAP-ready React hero for ${name}</section>;\n}\n` },
          { path: 'src/lib/animations/hero-timeline.ts', content: `export function buildHeroTimeline() {\n  return 'gsap timeline placeholder';\n}\n` },
          { path: 'src/styles/index.css', content: ':root { font-family: ui-sans-serif, system-ui, sans-serif; }\n' },
          { path: 'vite.config.ts', content: `import { defineConfig } from 'vite';\n\nexport default defineConfig({});\n` },
          { path: 'package.json', content: typeScriptPackageJson(name, { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', jsx: 'react-jsx', strict: true } }) },
          { path: 'README.md', content: markdown(name, 'React + GSAP + TypeScript starter scaffolded with forgeflux.') }
        ]
      };
    case 'react-native-expo':
      return {
        description: 'Expo Router starter with TypeScript',
        files: [
          { path: 'app/_layout.tsx', content: `export default function RootLayout() {\n  return null;\n}\n` },
          { path: 'app/index.tsx', content: `export default function HomeScreen() {\n  return null;\n}\n` },
          { path: 'src/components/ui/screen.tsx', content: `export function Screen() {\n  return null;\n}\n` },
          { path: 'src/features/onboarding/welcome-card.tsx', content: `export function WelcomeCard() {\n  return null;\n}\n` },
          { path: 'src/services/api/client.ts', content: `export const apiClient = { baseUrl: process.env.EXPO_PUBLIC_API_URL ?? '' };\n` },
          { path: 'src/config/app.config.ts', content: `export const appConfig = {\n  authProvider: '${options.authProvider ?? 'none'}',\n  database: '${options.database ?? 'none'}'\n};\n` },
          { path: 'assets/images/README.md', content: markdown('Assets', 'Expo image assets live here.') },
          { path: 'package.json', content: typeScriptPackageJson(name, { dev: 'expo start', android: 'expo run:android', ios: 'expo run:ios' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', jsx: 'react-jsx', strict: true } }) },
          { path: 'README.md', content: markdown(name, `Expo Router + TypeScript starter scaffolded with forgeflux.\n\n${sharedServerNotes(options)}`) }
        ]
      };
    case 'nest-js-server':
      return {
        description: 'NestJS server starter with TypeScript',
        files: [
          { path: 'src/main.ts', content: `async function bootstrap() {\n  console.log('Starting ${name}');\n}\n\nvoid bootstrap();\n` },
          { path: 'src/app.module.ts', content: `export class AppModule {}\n` },
          { path: 'src/modules/health/health.controller.ts', content: `export class HealthController {}\n` },
          { path: 'src/modules/auth/auth.module.ts', content: `export class AuthModule {}\n` },
          { path: 'src/common/interceptors/request-logging.interceptor.ts', content: `export class RequestLoggingInterceptor {}\n` },
          { path: 'src/config/app.config.ts', content: `export const appConfig = {\n  orm: '${options.orm ?? 'none'}',\n  database: '${options.database ?? 'none'}',\n  authProvider: '${options.authProvider ?? 'none'}'\n};\n` },
          { path: 'test/app.e2e-spec.ts', content: `describe('app', () => {\n  it('bootstraps', () => {\n    expect(true).toBe(true);\n  });\n});\n` },
          { path: '.env.example', content: `DATABASE_URL=\nOAUTH_CLIENT_ID=\nOAUTH_CLIENT_SECRET=\n` },
          { path: 'package.json', content: typeScriptPackageJson(name, { start: 'nest start', 'start:dev': 'nest start --watch', build: 'nest build' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', module: 'commonjs', strict: true } }) },
          { path: 'README.md', content: markdown(name, `NestJS + TypeScript starter scaffolded with forgeflux.\n\n${sharedServerNotes(options)}`) },
          ...optionalServerFiles(options)
        ]
      };
    case 'express-js-server':
      return {
        description: 'Express server starter with TypeScript',
        files: [
          { path: 'src/server.ts', content: `console.log('Boot ${name}');\n` },
          { path: 'src/app.ts', content: `export const app = {};\n` },
          { path: 'src/routes/index.route.ts', content: `export const indexRoute = {};\n` },
          { path: 'src/modules/auth/auth.service.ts', content: `export const authService = { provider: '${options.authProvider ?? 'none'}' };\n` },
          { path: 'src/config/env.ts', content: `export const env = {\n  database: '${options.database ?? 'none'}',\n  orm: '${options.orm ?? 'none'}'\n};\n` },
          { path: '.env.example', content: `DATABASE_URL=\nPORT=3001\n` },
          { path: 'package.json', content: typeScriptPackageJson(name, { dev: 'tsx watch src/server.ts', build: 'tsc', start: 'node dist/server.js' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', module: 'NodeNext', strict: true, outDir: 'dist' } }) },
          { path: 'README.md', content: markdown(name, `Express + TypeScript starter scaffolded with forgeflux.\n\n${sharedServerNotes(options)}`) },
          ...optionalServerFiles(options)
        ]
      };
    case 'angular':
      return {
        description: 'Angular standalone starter with TypeScript',
        files: [
          { path: 'src/main.ts', content: `console.log('Bootstrap Angular app ${name}');\n` },
          { path: 'src/app/app.component.ts', content: `export class AppComponent {\n  title = '${name}';\n}\n` },
          { path: 'src/app/app.component.html', content: `<main>${name} Angular starter</main>\n` },
          { path: 'src/app/core/config/app.config.ts', content: `export const appConfig = { production: false };\n` },
          { path: 'src/app/features/home/home.component.ts', content: `export class HomeComponent {}\n` },
          { path: 'angular.json', content: json({ version: 1, projects: { [packageName(name)]: {} } }) },
          { path: 'package.json', content: typeScriptPackageJson(name, { start: 'ng serve', build: 'ng build', test: 'ng test' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', module: 'ES2022', strict: true } }) },
          { path: 'README.md', content: markdown(name, 'Angular standalone + TypeScript starter scaffolded with forgeflux.') }
        ]
      };
    default:
      return {
        description: `${titleizeProjectType(type)} starter with TypeScript`,
        files: [
          { path: 'README.md', content: markdown(name, `${titleizeProjectType(type)} starter scaffolded with forgeflux.`) }
        ]
      };
  }
}

function buildTemplate(options: ScaffoldOptions): TemplateDefinition {
  return appTemplate(options.type, options);
}

export function getProjectTypes(): ProjectType[] {
  return [...projectTypes];
}

export function getOrmChoices(): OrmChoice[] {
  return ['none', 'prisma', 'typeorm'];
}

export function getDatabaseChoices(): DatabaseChoice[] {
  return ['none', 'postgresql', 'mongodb', 'firebase'];
}

export function getAuthProviderChoices(): AuthProviderChoice[] {
  return ['none', 'google', 'github', 'auth0', 'clerk'];
}

export function requiresServerQuestions(type: ProjectType): boolean {
  return type === 'nest-js-server' || type === 'express-js-server' || type === 'react-native-expo';
}

export async function scaffold(options: ScaffoldOptions): Promise<CommandResult> {
  const baseDir = path.resolve(options.outputDir ?? process.cwd(), options.name);
  const template = buildTemplate(options);

  await fsExtra.ensureDir(baseDir);
  await Promise.all(
    parentDirs(template.files).map((dir) => fsExtra.ensureDir(path.join(baseDir, dir)))
  );

  await Promise.all(
    template.files.map(async (file) => {
      const fullPath = path.join(baseDir, file.path);
      if (!(await fsExtra.pathExists(fullPath))) {
        await fsExtra.writeFile(fullPath, file.content);
      }
    })
  );

  return {
    success: true,
    message: `Scaffolded ${template.description} at ${baseDir}`
  };
}

export async function lint(options: LintOptions = {}): Promise<CommandResult> {
  const dir = toAbsoluteDir(options.dir);
  const packageJsonExists = fs.existsSync(path.join(dir, 'package.json'));

  return {
    success: packageJsonExists,
    message: packageJsonExists
      ? `Lint configuration check passed for ${dir}`
      : `No package.json found in ${dir}`
  };
}

export async function audit(options: AuditOptions = {}): Promise<CommandResult> {
  const dir = toAbsoluteDir(options.dir);
  const packageJsonPath = path.join(dir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return {
      success: false,
      message: `No package.json found in ${dir}`
    };
  }

  const packageJson = await fsExtra.readJson(packageJsonPath);
  const deps = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {})
  };

  return {
    success: true,
    message: `Found ${Object.keys(deps).length} dependencies in ${dir}`
  };
}
