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

import { asArray } from '@theia/clangd-contexts/lib/util/maybe-array';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Returns all files that match the given predicate, starting from a given start path. If the start path
 * is a file this function will just check if the file matches the predicate. If the start path is a directory
 * the function looks recursively for all matching files within the directory.
 * @param startPath The start path(s)
 * @param predicate The predicate that needs to be matched
 * @returns All matching files as array.
 */
export function findMatchingFiles(startPath: string | string[], predicate: (file: string) => boolean): string[] {
    let startPaths = asArray(startPath);
    if (process.platform === 'win32') {
        startPaths = startPaths.map(p => p.replace(/^\/+/, ''));
    }

    const results: string[] = [];
    startPaths.forEach(p => collectMatchingFiles(p, predicate, results));
    return results;
}

function collectMatchingFiles(startPath: string, predicate: (file: string) => boolean, results: string[]): void {
    const fileStat = fs.statSync(startPath);
    if (fileStat.isFile() && predicate(startPath)) {
        results.push(startPath);
        return;
    }

    const filenames = fs.readdirSync(startPath).map(file => path.join(startPath, file));
    filenames.forEach(filename => {
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            collectMatchingFiles(filename, predicate, results);
        } else if (stat.isFile() && predicate(filename)) {
            results.push(filename);
        }
    });
}

/**
 * Helper function to restart the clangd language server.
 * @returns A promise that resolves once the server has been successfully restarted.
 */
export async function restartClangdLanguageServer(): Promise<void> {
    try {
        await vscode.commands.executeCommand('clangd.restart');
    } catch (error) {
        /*
         * Catch errors that might occur during stopping and starting the clangd language server
         * and do not handle them, as they are expected.
         */
    }
}
