import fs from 'node:fs';
import path from 'node:path';
import fsExtra from 'fs-extra';
import { getNestAuthFiles } from './templates/nestjs-auth';
import { getExpressAuthFiles } from './templates/express-auth';

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

function buildPackageJson(
  name: string,
  scripts: Record<string, string>,
  deps?: Record<string, string>,
  devDeps?: Record<string, string>,
  moduleType?: string
): string {
  const pkg: Record<string, unknown> = {
    name: packageName(name),
    version: '0.1.0',
    private: true,
    scripts
  };
  if (moduleType !== undefined) {
    pkg.type = moduleType;
  }
  if (deps && Object.keys(deps).length > 0) {
    pkg.dependencies = deps;
  }
  if (devDeps && Object.keys(devDeps).length > 0) {
    pkg.devDependencies = devDeps;
  }
  return json(pkg);
}

function sharedServerNotes(options: ScaffoldOptions): string {
  return [
    `ORM: ${options.orm ?? 'none'}`,
    `Database: ${options.database ?? 'none'}`,
    `OAuth provider: ${options.authProvider ?? 'none'}`
  ].join('\n');
}

function serverReadme(
  name: string,
  title: string,
  options: ScaffoldOptions,
  runSteps: string[]
): string {
  const prismaSetup =
    options.orm === 'prisma'
      ? [
          '## Prisma Setup',
          '',
          '1. Copy `.env.example` to `.env`',
          '2. Set `DATABASE_URL`',
          '3. Run `npm run prisma:generate`',
          `4. ${options.database === 'mongodb' ? 'Start your database and begin development' : 'Run your first migration with `npx prisma migrate dev --name init`'}`,
          '',
        ].join('\n')
      : '';

  return [
    `# ${name}`,
    '',
    `${title} scaffolded with forgeflux.`,
    '',
    '## Architecture Choices',
    '',
    `- ORM: ${options.orm ?? 'none'}`,
    `- Database: ${options.database ?? 'none'}`,
    `- OAuth provider: ${options.authProvider ?? 'none'}`,
    '',
    '## Getting Started',
    '',
    '1. Install dependencies with `npm install`',
    ...runSteps.map((step, index) => `${index + 2}. ${step}`),
    '',
    prismaSetup,
    '## Environment',
    '',
    'Review `.env.example` and fill in the required values before running the project.',
    '',
  ].join('\n');
}

function optionalServerFiles(options: ScaffoldOptions): TemplateFile[] {
  const files: TemplateFile[] = [];

  if (options.orm === 'prisma') {
    files.push({
      path: 'prisma/schema.prisma',
      content:
        options.database === 'mongodb'
          ? `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "mongodb"\n  url      = env("DATABASE_URL")\n}\n\nmodel User {\n  id                     String   @id @default(auto()) @map("_id") @db.ObjectId\n  email                  String   @unique\n  name                   String\n  password               String\n  emailVerified          Boolean  @default(false)\n  emailVerificationToken String?\n  resetPasswordToken     String?\n  resetPasswordExpires   DateTime?\n  twoFactorEnabled       Boolean  @default(false)\n  twoFactorSecret        String?\n  createdAt              DateTime @default(now())\n  updatedAt              DateTime @updatedAt\n}\n`
          : `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\nmodel User {\n  id                     String   @id @default(cuid())\n  email                  String   @unique\n  name                   String\n  password               String\n  emailVerified          Boolean  @default(false)\n  emailVerificationToken String?\n  resetPasswordToken     String?\n  resetPasswordExpires   DateTime?\n  twoFactorEnabled       Boolean  @default(false)\n  twoFactorSecret        String?\n  createdAt              DateTime @default(now())\n  updatedAt              DateTime @updatedAt\n}\n`
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
          { path: 'package.json', content: buildPackageJson(name, { dev: 'next dev', build: 'next build', start: 'next start' }, { next: '^15.1.0', react: '^19.0.0', 'react-dom': '^19.0.0' }, { typescript: '^5.7.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0', '@types/node': '^22.0.0' }) },
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
          { path: 'package.json', content: buildPackageJson(name, { dev: 'next dev', build: 'next build', start: 'next start' }, { next: '^15.1.0', react: '^19.0.0', 'react-dom': '^19.0.0', gsap: '^3.12.0' }, { typescript: '^5.7.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0', '@types/node': '^22.0.0' }) },
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
          { path: 'index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${name}</title></head>\n<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>\n</html>\n` },
          { path: 'vite.config.ts', content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });\n` },
          { path: 'package.json', content: buildPackageJson(name, { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' }, { react: '^19.0.0', 'react-dom': '^19.0.0' }, { vite: '^6.0.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.7.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0' }, 'module') },
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
          { path: 'index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${name}</title></head>\n<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>\n</html>\n` },
          { path: 'vite.config.ts', content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });\n` },
          { path: 'package.json', content: buildPackageJson(name, { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' }, { react: '^19.0.0', 'react-dom': '^19.0.0', gsap: '^3.12.0' }, { vite: '^6.0.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.7.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0' }, 'module') },
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
          { path: 'app.json', content: json({ expo: { name: name, slug: packageName(name), version: '1.0.0', scheme: packageName(name), platforms: ['ios', 'android'] } }) },
          { path: 'package.json', content: buildPackageJson(name, { dev: 'expo start', android: 'expo run:android', ios: 'expo run:ios' }, { expo: '^52.0.0', 'expo-router': '^4.0.0', 'expo-status-bar': '^2.0.0', react: '^18.3.0', 'react-native': '^0.76.0' }, { '@types/react': '^18.3.0', typescript: '^5.7.0' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, baseUrl: '.', paths: { '@/*': ['src/*'] } } }) },
          { path: 'README.md', content: markdown(name, `Expo Router + TypeScript starter scaffolded with forgeflux.\n\n${sharedServerNotes(options)}`) }
        ]
      };
    case 'nest-js-server':
      return {
        description: 'NestJS server starter with TypeScript',
        files: [
          ...getNestAuthFiles(name),
          { path: '.env.example', content: `PORT=3000\nJWT_SECRET=change-me-in-production\nDATABASE_URL=\nSMTP_HOST=smtp.ethereal.email\nSMTP_PORT=587\nSMTP_USER=\nSMTP_PASS=\n` },
          { path: 'package.json', content: buildPackageJson(name, { start: 'node dist/main.js', 'start:dev': 'nest start --watch', build: 'nest build', 'prisma:generate': 'prisma generate', 'prisma:migrate': 'prisma migrate dev --name init' }, { '@nestjs/common': '^10.4.0', '@nestjs/core': '^10.4.0', '@nestjs/platform-express': '^10.4.0', '@nestjs/jwt': '^10.2.0', '@nestjs/passport': '^10.0.0', '@prisma/client': '^6.0.0', 'reflect-metadata': '^0.2.0', rxjs: '^7.8.0', bcrypt: '^5.1.0', nodemailer: '^6.9.0', 'class-validator': '^0.14.0', 'class-transformer': '^0.5.0', passport: '^0.7.0', 'passport-jwt': '^4.0.0', speakeasy: '^2.0.0', qrcode: '^1.5.0' }, { '@nestjs/cli': '^10.4.0', '@nestjs/schematics': '^10.2.0', '@types/express': '^5.0.0', '@types/bcrypt': '^5.0.0', '@types/nodemailer': '^6.4.0', '@types/passport-jwt': '^4.0.0', '@types/qrcode': '^1.5.0', '@types/speakeasy': '^2.0.10', prisma: '^6.0.0', typescript: '^5.7.0', 'ts-node': '^10.9.0', 'tsconfig-paths': '^4.2.0' }) },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2021', module: 'commonjs', moduleResolution: 'node', strict: true, emitDecoratorMetadata: true, experimentalDecorators: true, allowSyntheticDefaultImports: true, outDir: './dist', baseUrl: './src', paths: { '@/*': ['*'] }, skipLibCheck: true, strictNullChecks: true, declaration: true, removeComments: true, sourceMap: true, incremental: true } }) },
          { path: 'README.md', content: serverReadme(name, 'NestJS + TypeScript server', options, ['Copy `.env.example` to `.env`', 'Run `npm run prisma:generate`', `${options.orm === 'prisma' && options.database !== 'mongodb' ? 'Run `npm run prisma:migrate`' : 'Review the generated Prisma schema if needed'}`, 'Run `npm run start:dev`']) },
          ...optionalServerFiles(options)
        ]
      };
    case 'express-js-server':
      return {
        description: 'Express server starter with TypeScript',
        files: [
          ...getExpressAuthFiles(name),
          { path: '.env.example', content: `PORT=3001\nJWT_SECRET=change-me-in-production\nDATABASE_URL=\nSMTP_HOST=smtp.ethereal.email\nSMTP_PORT=587\nSMTP_USER=\nSMTP_PASS=\n` },
          { path: 'package.json', content: buildPackageJson(name, { dev: 'tsx watch --tsconfig tsconfig.json src/server.ts', build: 'tsc && tsc-alias', start: 'node dist/server.js', 'prisma:generate': 'prisma generate', 'prisma:migrate': 'prisma migrate dev --name init' }, { '@prisma/client': '^6.0.0', express: '^5.0.0', cors: '^2.8.0', bcrypt: '^5.1.0', jsonwebtoken: '^9.0.0', nodemailer: '^6.9.0', zod: '^3.23.0', speakeasy: '^2.0.0', qrcode: '^1.5.0', dotenv: '^16.4.0' }, { tsx: '^4.19.0', typescript: '^5.7.0', '@types/node': '^22.0.0', '@types/express': '^5.0.0', '@types/cors': '^2.8.0', '@types/bcrypt': '^5.0.0', '@types/jsonwebtoken': '^9.0.0', '@types/nodemailer': '^6.4.0', '@types/qrcode': '^1.5.0', '@types/speakeasy': '^2.0.10', prisma: '^6.0.0', 'tsc-alias': '^1.8.10' }, 'module') },
          { path: 'tsconfig.json', content: json({ compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', strict: true, outDir: 'dist', rootDir: 'src', baseUrl: './src', paths: { '@/*': ['*'] }, esModuleInterop: true, skipLibCheck: true, types: ['node'] } }) },
          { path: 'README.md', content: serverReadme(name, 'Express + TypeScript server', options, ['Copy `.env.example` to `.env`', 'Run `npm run prisma:generate`', `${options.orm === 'prisma' && options.database !== 'mongodb' ? 'Run `npm run prisma:migrate`' : 'Review the generated Prisma schema if needed'}`, 'Run `npm run dev`']) },
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
          { path: 'src/index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8" /><title>${name}</title><base href="/"></head>\n<body><app-root></app-root></body>\n</html>\n` },
          { path: 'package.json', content: buildPackageJson(name, { start: 'ng serve', build: 'ng build', test: 'ng test' }, { '@angular/core': '^19.0.0', '@angular/common': '^19.0.0', '@angular/compiler': '^19.0.0', '@angular/platform-browser': '^19.0.0', '@angular/platform-browser-dynamic': '^19.0.0', '@angular/router': '^19.0.0', rxjs: '^7.8.0', 'zone.js': '^0.15.0', tslib: '^2.8.0' }, { '@angular/cli': '^19.0.0', '@angular/compiler-cli': '^19.0.0', '@angular/build': '^19.0.0', typescript: '^5.7.0' }) },
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
