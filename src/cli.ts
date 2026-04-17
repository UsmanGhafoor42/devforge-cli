import { Command } from 'commander';
import enquirer from 'enquirer';
import { Chalk } from 'chalk';
import ora from 'ora';

import { audit, lint, scaffold, type ProjectType } from './index.js';

const chalk = new Chalk();

async function resolveProjectType(type?: string): Promise<ProjectType> {
  if (type === 'npm' || type === 'vscode' || type === 'wordpress' || type === 'shopify') {
    return type;
  }

  const response = await enquirer.prompt<{ type: ProjectType }>({
    type: 'select',
    name: 'type',
    message: 'Choose a project type',
    choices: ['npm', 'vscode', 'wordpress', 'shopify']
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

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('devforge')
    .description('Scaffold and audit starter projects across popular developer platforms.')
    .version('1.0.0');

  program
    .command('scaffold')
    .description('Generate a starter project')
    .option('--type <type>', 'Project type: npm, vscode, wordpress, shopify')
    .option('--name <name>', 'Project name')
    .action(async (options: { type?: string; name?: string }) => {
      const type = await resolveProjectType(options.type);
      const name = await resolveProjectName(options.name);
      const spinner = ora(`Scaffolding ${name}...`).start();

      try {
        const result = await scaffold({ type, name });
        spinner.succeed(chalk.green(result.message));
      } catch (error) {
        spinner.fail(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exitCode = 1;
      }
    });

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
