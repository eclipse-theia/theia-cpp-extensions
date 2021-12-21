/********************************************************************************
 * Copyright (c) 2021 STMicroelectronics and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 *******************************************************************************/

import * as vscode from 'vscode';
import {
    buildConfigurations,
    changeBuildConfigurationCommandHandler,
    CHANGE_BUILD_CONFIGURATION_COMMAND,
    CLANGD_CONFIG_FILE,
    COMPILATION_DATABASE_FILE,
    createBuildConfigurationStatusItem,
    loadBuildConfiguration,
    updateBuildConfigStatus,
} from './build-configuration';
import { ignoreGCCFlagsCommandHandler, IGNORE_GCC_FLAGS_COMMAND } from './ignore-gcc-flags-command';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    context.subscriptions.push(
        vscode.commands.registerCommand(CHANGE_BUILD_CONFIGURATION_COMMAND, () =>
            changeBuildConfigurationCommandHandler(buildConfigurations)
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(IGNORE_GCC_FLAGS_COMMAND, (...args: unknown[]) => ignoreGCCFlagsCommandHandler(args))
    );

    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => loadBuildConfiguration()));

    const cdbWatcher = vscode.workspace.createFileSystemWatcher(`**/${COMPILATION_DATABASE_FILE}`, false, true, false);
    context.subscriptions.push(cdbWatcher);
    context.subscriptions.push(cdbWatcher.onDidCreate(handleFileChange));
    context.subscriptions.push(cdbWatcher.onDidDelete(clearBuildConfigStatus));

    const configWatcher = vscode.workspace.createFileSystemWatcher(`**/${CLANGD_CONFIG_FILE}`, false, false, false);
    context.subscriptions.push(configWatcher);
    context.subscriptions.push(configWatcher.onDidCreate(handleFileChange));
    context.subscriptions.push(configWatcher.onDidChange(handleFileChange));
    context.subscriptions.push(configWatcher.onDidDelete(clearBuildConfigStatus));

    // Unlike the CLI example, this example does not use nor recognize `.clangd-contexts` files

    createBuildConfigurationStatusItem();
    loadBuildConfiguration();
}

function handleFileChange(uri: vscode.Uri): void {
    if (uri.path.endsWith(COMPILATION_DATABASE_FILE) || uri.path.endsWith(CLANGD_CONFIG_FILE)) {
        loadBuildConfiguration();
    }
}

function clearBuildConfigStatus(uri: vscode.Uri): void {
    updateBuildConfigStatus();
}

// this method is called when your extension is deactivated
export function deactivate(): void { }
