'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EntityTreeProvider } from './entities/EntityTreeProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log("vscode-minecraft-bedrock-addon is now active!");

    const entityTreeProvider = new EntityTreeProvider(vscode.workspace.workspaceFolders);
    vscode.window.registerTreeDataProvider('entityTree', entityTreeProvider);


    //context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}