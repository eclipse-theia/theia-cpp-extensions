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

import { getContext, setContext, ClangdContext } from '@theia/clangd-contexts';
import * as path from 'path';
import * as vscode from 'vscode';
import { findMatchingFiles, restartClangdLanguageServer } from './util';

/** Placeholder for the empty/undefined clangd context. */
const NO_CONTEXT: ClangdContext = {
    name: 'NO_CONTEXT',
    compilationDatabase: '',
};

const projectDirs: string[] = [];
export const COMPILATION_DATABASE_FILE = 'compile_commands.json';
export const CLANGD_CONFIG_FILE = '.clangd';
export const buildConfigurations: Map<string, BuildConfiguration[]> = new Map();

export interface BuildConfiguration {
    rootDir: string;
    contextDirectory: string;
}

export async function loadBuildConfiguration(): Promise<void> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        updateBuildConfigStatus();
        return;
    }
    buildConfigurations.clear();
    const uniqueRoots = collectUniqueRootDirs(vscode.workspace.workspaceFolders);
    const compilationDbs = findMatchingFiles(uniqueRoots, file => file.endsWith(COMPILATION_DATABASE_FILE));
    compilationDbs.forEach(compilationDatabase => {
        const contextDirectory = path.dirname(compilationDatabase);
        const configName = path.basename(contextDirectory);
        const rootDir = path.dirname(contextDirectory);
        if (!projectDirs.includes(rootDir)) {
            projectDirs.push(rootDir);
        }
        const configs = buildConfigurations.get(configName) ?? [];
        configs.push({ rootDir, contextDirectory });
        buildConfigurations.set(configName, configs);
    });

    const configDirs = projectDirs.map(dir => getContext(dir) ?? NO_CONTEXT);
    if (configDirs.length > 0) {
        const buildConfigName = configDirs[0].name;
        if (configDirs.every(context => context.name === buildConfigName)) {
            updateBuildConfigStatus(buildConfigName);
            return;
        }
    }
    updateBuildConfigStatus();
}

let contextStatusItem: vscode.StatusBarItem;

export function createBuildConfigurationStatusItem(): vscode.StatusBarItem {
    contextStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    contextStatusItem.command = CHANGE_BUILD_CONFIGURATION_COMMAND;
    contextStatusItem.show();
    updateBuildConfigStatus();
    return contextStatusItem;
}

export function updateBuildConfigStatus(buildConfiguration?: string): void {
    contextStatusItem.text = `Build configuration: ${buildConfiguration ?? 'NONE'}`;
}

export const CHANGE_BUILD_CONFIGURATION_COMMAND = 'theia-clangd-contexts.change.buildConfig';

export async function changeBuildConfigurationCommandHandler(configs: Map<string, BuildConfiguration[]>): Promise<void> {
    if (configs.size === 0) {
        vscode.window.showQuickPick([], {
            title: 'Select new build configuration',
            placeHolder: 'Could not find any build configurations for this workspace.',
        });
        return;
    }

    const newConfigName = await vscode.window.showQuickPick(Array.from(configs.keys()), {
        title: 'Select new build configuration',
        placeHolder: 'Name of the build configuration',
    });

    if (newConfigName) {
        const result = configs.get(newConfigName) ?? [];
        result.forEach(buildConfig => setContext(buildConfig.rootDir, buildConfig.contextDirectory));
        await restartClangdLanguageServer();
        vscode.window.showInformationMessage(`Build configuration has been changed to: ${newConfigName}`);
        updateBuildConfigStatus(newConfigName);
    }
}

/**
 * Collect the unique root directories amongst a list of workspace folders.
 * The unique root directories exclude any that are subdirectories of other workspace
 * roots (VS Code allows directories within some workspace root to be added as additional roots).
 *
 * @param workspaces the workspace root folders
 * @returns the unique root folders
 */
function collectUniqueRootDirs(workspaces: readonly vscode.WorkspaceFolder[]): string[] {
    // These directory paths all end with a path separator so that prefix testing matches
    // only whole path segments
    const roots = workspaces.map(ws => normalizeDir(ws.uri.path));
    return roots.filter(root => !roots.some(other => root !== other && other.startsWith(root)));
}

function normalizeDir(dir: string): string {
    const result = path.normalize(dir);
    return result.endsWith(path.sep) ? result : result + path.sep;
}
