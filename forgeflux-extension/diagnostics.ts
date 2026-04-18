import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';

export function registerDiagnostics(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection('forgeflux');

  context.subscriptions.push(diagnosticCollection);

  vscode.workspace.onDidOpenTextDocument(
    (document: vscode.TextDocument) =>
      runDiagnostics(document, diagnosticCollection),
    null,
    context.subscriptions
  );

  vscode.workspace.onDidSaveTextDocument(
    (document: vscode.TextDocument) =>
      runDiagnostics(document, diagnosticCollection),
    null,
    context.subscriptions
  );

  vscode.workspace.textDocuments.forEach((document: vscode.TextDocument) =>
    runDiagnostics(document, diagnosticCollection)
  );
}

function runDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
) {
  if (!document.fileName.endsWith('package.json')) return;

  const diagnostics: vscode.Diagnostic[] = [];
  const dir = path.dirname(document.fileName);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(document.getText());
  } catch {
    return;
  }

  if (typeof parsed.main === 'string') {
    const mainPath = path.join(dir, parsed.main);
    if (!fs.existsSync(mainPath)) {
      const range = getRangeForKey(document, '"main"');
      if (range) {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `forgeflux: "main" points to "${parsed.main}" which does not exist yet.`,
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
    }
  }

  if (parsed.bin && typeof parsed.bin === 'object') {
    for (const [commandName, binPath] of Object.entries(parsed.bin)) {
      if (typeof binPath !== 'string') continue;
      const fullPath = path.join(dir, binPath);
      if (!fs.existsSync(fullPath)) {
        const range = getRangeForKey(document, '"bin"');
        if (range) {
          diagnostics.push(
            new vscode.Diagnostic(
              range,
              `forgeflux: bin entry "${commandName}" points to missing file "${binPath}".`,
              vscode.DiagnosticSeverity.Warning
            )
          );
        }
      }
    }
  }

  if (!parsed.license) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 1)),
        'forgeflux: "license" field is missing from package.json.',
        vscode.DiagnosticSeverity.Information
      )
    );
  }

  if (typeof parsed.description !== 'string' || parsed.description.trim() === '') {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 1)),
        'forgeflux: "description" field is missing or empty.',
        vscode.DiagnosticSeverity.Information
      )
    );
  }

  collection.set(document.uri, diagnostics);
}

function getRangeForKey(
  document: vscode.TextDocument,
  key: string
): vscode.Range | null {
  const index = document.getText().indexOf(key);
  if (index === -1) return null;
  const start = document.positionAt(index);
  const end = document.positionAt(index + key.length);
  return new vscode.Range(start, end);
}
