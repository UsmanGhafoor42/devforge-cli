import { Command } from 'commander';
import enquirer from 'enquirer';
import { Chalk } from 'chalk';
import oraModule from 'ora';

import {
  audit,
  getAuthProviderChoices,
  getDatabaseChoices,
  getOrmChoices,
  getProjectTypes,
  lint,
  requiresServerQuestions,
  scaffold,
  type AuthProviderChoice,
  type DatabaseChoice,
  type OrmChoice,
  type ProjectType,
  type ScaffoldOptions
} from './index.js';

const chalk = new Chalk();
const ora = (oraModule as unknown as { default?: typeof oraModule }).default ?? oraModule;

async function resolveProjectType(type?: string): Promise<ProjectType> {
  if (type && getProjectTypes().includes(type as ProjectType)) {
    return type as ProjectType;
  }

  const response = await enquirer.prompt<{ type: ProjectType }>({
    type: 'select',
    name: 'type',
    message: 'Choose a project type',
    choices: getProjectTypes()
  });

  return response.type;
}

async function resolveProjectName(name?: string): Promise<string> {
  if (name) {
    return name;
  }

  const response = await enquirer.prompt<{ name: string }>({
    type: 'input',
    name: 'name',
    message: 'Project name'
  });

  return response.name;
}

async function resolveOrmChoice(orm?: string): Promise<OrmChoice> {
  if (orm && getOrmChoices().includes(orm as OrmChoice)) {
    return orm as OrmChoice;
  }

  const response = await enquirer.prompt<{ orm: OrmChoice }>({
    type: 'select',
    name: 'orm',
    message: 'Select ORM',
    choices: getOrmChoices()
  });

  return response.orm;
}

async function resolveDatabaseChoice(database?: string): Promise<DatabaseChoice> {
  if (database && getDatabaseChoices().includes(database as DatabaseChoice)) {
    return database as DatabaseChoice;
  }

  const response = await enquirer.prompt<{ database: DatabaseChoice }>({
    type: 'select',
    name: 'database',
    message: 'Select database',
    choices: getDatabaseChoices()
  });

  return response.database;
}

async function resolveAuthProvider(authProvider?: string): Promise<AuthProviderChoice> {
  if (authProvider && getAuthProviderChoices().includes(authProvider as AuthProviderChoice)) {
    return authProvider as AuthProviderChoice;
  }

  const response = await enquirer.prompt<{ authProvider: AuthProviderChoice }>({
    type: 'select',
    name: 'authProvider',
    message: 'Select OAuth provider',
    choices: getAuthProviderChoices()
  });

  return response.authProvider;
}

async function resolveScaffoldOptions(options: {
  type?: string;
  name?: string;
  orm?: string;
  database?: string;
  authProvider?: string;
}): Promise<ScaffoldOptions> {
  const type = await resolveProjectType(options.type);
  const name = await resolveProjectName(options.name);

  if (!requiresServerQuestions(type)) {
    return { type, name };
  }

  const orm = await resolveOrmChoice(options.orm);
  const database = await resolveDatabaseChoice(options.database);
  const authProvider = await resolveAuthProvider(options.authProvider);

  return {
    type,
    name,
    orm,
    database,
    authProvider
  };
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('devforge')
    .description('Scaffold modern TypeScript projects and starter servers across frontend and backend stacks.')
    .version('1.0.0');

  program
    .command('scaffold')
    .description('Generate a starter project')
    .option('--type <type>', 'Project type')
    .option('--name <name>', 'Project name')
    .option('--orm <orm>', 'ORM: prisma, typeorm, none')
    .option('--database <database>', 'Database: postgresql, mongodb, firebase, none')
    .option('--auth-provider <authProvider>', 'OAuth provider: google, github, auth0, clerk, none')
    .action(
      async (options: {
        type?: string;
        name?: string;
        orm?: string;
        database?: string;
        authProvider?: string;
      }) => {
        const resolvedOptions = await resolveScaffoldOptions(options);
        const spinner = ora(`Scaffolding ${resolvedOptions.name}...`).start();

        try {
          const result = await scaffold(resolvedOptions);
          spinner.succeed(chalk.green(result.message));
        } catch (error) {
          spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
          process.exitCode = 1;
        }
      }
    );

  program
    .command('lint')
    .description('Check whether the current project is ready for linting')
    .action(async () => {
      const result = await lint();
      const color = result.success ? chalk.green : chalk.yellow;
      console.log(color(result.message));
      if (!result.success) {
        process.exitCode = 1;
      }
    });

  program
    .command('audit')
    .description('Summarise dependency inventory for the current project')
    .action(async () => {
      const result = await audit();
      const color = result.success ? chalk.green : chalk.yellow;
      console.log(color(result.message));
      if (!result.success) {
        process.exitCode = 1;
      }
    });

  await program.parseAsync(argv);
}
