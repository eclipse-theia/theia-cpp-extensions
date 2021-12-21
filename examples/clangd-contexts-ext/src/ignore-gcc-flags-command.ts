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

import { CONFIG_FILE_NAME, setCompileFlags } from '@theia/clangd-contexts';
import * as vscode from 'vscode';
import { findMatchingFiles, restartClangdLanguageServer } from './util';
export const IGNORE_GCC_FLAGS_COMMAND = 'theia-clangd-contexts.ignore.gccFlags';
export const GCC_FLAGS = ['-fstack-usage'];

export async function ignoreGCCFlagsCommandHandler(args: unknown[]): Promise<void> {
    // As the VS Code workspace may have multiple roots, we support any number of URI args
    let paths = getPaths(args)?.map(uri => uri.fsPath);
    if (!paths && vscode.workspace.workspaceFolders) {
        paths = vscode.workspace.workspaceFolders.map(folder => folder.uri).filter(isFileUri).map(uri => uri.fsPath);
    }

    if (!paths || paths?.length === 0) {
        return;
    }

    paths.map(path => findMatchingFiles(path, file => file.endsWith(CONFIG_FILE_NAME)))
        .reduce((flattened, array) => flattened.concat(array), [])
        .forEach(configFile => setCompileFlags(configFile, undefined, GCC_FLAGS));

    await restartClangdLanguageServer();
}

function getPaths(args: unknown[]): vscode.Uri[] | undefined {
    if (args.length > 0 && args.some(isFileUri)) {
        return args.filter(isFileUri);
    }
    return undefined;
}

function isFileUri(object: unknown): object is vscode.Uri {
    return object instanceof vscode.Uri && object.scheme === 'file';
}
