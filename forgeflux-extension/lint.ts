import * as vscode from 'vscode';

function workspaceCwd(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function ensureWorkspace(): string | undefined {
  const cwd = workspaceCwd();

  if (!cwd) {
    vscode.window.showWarningMessage('forgeflux: Open a project folder first.');
    return undefined;
  }

  return cwd;
}

function runTerminalCommand(name: string, command: string, cwd: string): void {
  const terminal = vscode.window.createTerminal({ name, cwd });
  terminal.show();
  terminal.sendText(command);
}

export function registerLintCommands(context: vscode.ExtensionContext) {
  const lintCmd = vscode.commands.registerCommand('forgeflux.lint', async () => {
    const cwd = ensureWorkspace();
    if (!cwd) return;

    runTerminalCommand('forgeflux: lint', 'npx forgeflux lint', cwd);
  });

  const auditCmd = vscode.commands.registerCommand('forgeflux.audit', async () => {
    const cwd = ensureWorkspace();
    if (!cwd) return;

    runTerminalCommand('forgeflux: audit', 'npx forgeflux audit', cwd);
  });

  context.subscriptions.push(lintCmd, auditCmd);
}
