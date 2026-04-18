import * as vscode from 'vscode';
import { registerScaffoldCommands } from './scaffold';
import { registerLintCommands } from './lint';
import { registerDiagnostics } from './diagnostics';

export function activate(context: vscode.ExtensionContext) {
  console.log('forgeflux extension activated');

  registerScaffoldCommands(context);
  registerLintCommands(context);
  registerDiagnostics(context);

  vscode.window.showInformationMessage('forgeflux is ready!');
}

export function deactivate() {}
