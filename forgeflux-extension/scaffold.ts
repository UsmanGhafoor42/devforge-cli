import * as vscode from 'vscode';

const PROJECT_TYPES = [
  'nextjs',
  'nextjs-gsap',
  'react',
  'react-gsap',
  'react-native-expo',
  'nest-js-server',
  'express-js-server',
  'angular',
] as const;

const ORM_CHOICES = ['none', 'prisma', 'typeorm'] as const;
const DATABASE_CHOICES = ['none', 'postgresql', 'mongodb', 'firebase'] as const;
const AUTH_PROVIDER_CHOICES = ['none', 'google', 'github', 'auth0', 'clerk'] as const;

type ProjectType = (typeof PROJECT_TYPES)[number];

function requiresArchitecturePrompts(type: ProjectType): boolean {
  return (
    type === 'react-native-expo' ||
    type === 'nest-js-server' ||
    type === 'express-js-server'
  );
}

async function pickValue(
  placeHolder: string,
  values: readonly string[]
): Promise<string | undefined> {
  return vscode.window.showQuickPick([...values], { placeHolder });
}

function workspaceCwd(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function runInTerminal(command: string, name: string): void {
  const terminal = vscode.window.createTerminal({
    name,
    cwd: workspaceCwd(),
  });

  terminal.show();
  terminal.sendText(command);
}

export function registerScaffoldCommands(context: vscode.ExtensionContext) {
  const scaffoldCmd = vscode.commands.registerCommand(
    'forgeflux.scaffold',
    async () => {
      const type = (await pickValue(
        'Choose a project type',
        PROJECT_TYPES
      )) as ProjectType | undefined;
      if (!type) return;

      const projectName = await vscode.window.showInputBox({
        prompt: 'Enter your project name',
        placeHolder: 'my-app',
        validateInput: (value: string) =>
          value.trim().length === 0 ? 'Project name cannot be empty' : undefined,
      });
      if (!projectName) return;

      let command = `npx forgeflux scaffold --type ${type} --name ${projectName}`;

      if (requiresArchitecturePrompts(type)) {
        const orm = await pickValue('Select ORM', ORM_CHOICES);
        if (!orm) return;

        const database = await pickValue('Select database', DATABASE_CHOICES);
        if (!database) return;

        const authProvider = await pickValue(
          'Select OAuth provider',
          AUTH_PROVIDER_CHOICES
        );
        if (!authProvider) return;

        command += ` --orm ${orm} --database ${database} --auth-provider ${authProvider}`;
      }

      runInTerminal(command, `forgeflux: scaffold ${projectName}`);
      vscode.window.showInformationMessage(
        `Scaffolding ${type} project: ${projectName}`
      );
    }
  );

  context.subscriptions.push(scaffoldCmd);
}
