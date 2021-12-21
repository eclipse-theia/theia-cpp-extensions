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

import * as fs from 'fs';
import * as paths from 'path';
import { CONFIG_FILE_NAME } from '../clangd-config';

/** A regex that matches possibly repeated host-platform path separator. */
const pathSepRegex = new RegExp(`\\${paths.sep}+`, 'g'); // Escape the sep, whether '\' or '/', for safety

/**
 * Queries whether a given `path` represents a file.
 *
 * @param path a path to test
 * @returns `true` if the `path` is a file, `false` otherwise
 */
export function isFile(path: string): boolean {
    try {
        return fs.statSync(path).isFile();
    } catch (error) {
        return false;
    }
}

/**
 * Queries whether a given `path` represents a directory.
 *
 * @param path a path to test
 * @returns `true` if the `path` is a directory, `false` otherwise
 */
export function isDirectory(path: string): boolean {
    try {
        return fs.statSync(path).isDirectory();
    } catch (error) {
        return false;
    }
}

/**
 * Resolve a path to a _clangd_ configuration file.
 *
 * @param filePath a path that may or may not already identify a `.clangd` file
 * @returns the `filePath` if it is a `.clangd` file, otherwise a path that resolves a `.clangd` file as
 * a child or sibling of the `filePath` according to whether it is a directory or file, respectively
 */
export function toConfigPath(filePath: string): string {
    return paths.basename(filePath) === CONFIG_FILE_NAME ? filePath : paths.resolve(filePath, CONFIG_FILE_NAME);
}

/**
 * Obtain a uniform representation of a `path` regardless of host platform. This should only be used for relative paths
 * (so not involving drive letters on Windows platform) to obtain an identifier or name used for some
 * other purpose than accessing the filesystem.
 *
 * @param path a path in the host filesystem
 * @returns a representation of the `path` using `/` to separate segments
 */
export function toPortablePath(path: string): string {
    if (paths.sep !== '/') {
        return path.split(pathSepRegex).join('/');
    }
    return path;
}
