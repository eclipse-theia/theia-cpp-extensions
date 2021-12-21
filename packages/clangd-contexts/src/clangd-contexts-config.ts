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

import { readdirSync, readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { ClangdConfig, loadOrCreate } from '.';
import { isDirectory, toPortablePath } from './util/file-util';

export const COMPILE_COMMANDS_FILE = 'compile_commands.json';
const CONFIG_FILE = '.clangd-contexts';

export interface ClangdProjectConfig {
    /** The workspace-relative path to the project. */
    path: string;
    /** The layout of context directories within the project. */
    contextDirs: 'flat' | 'nested';
}

export interface ClangdContextsConfig {
    /** The directory path containing the `.clangd-contexts` file describing this configuration. */
    path: string;
    /** An optional name for the clangd workspace overall. */
    workspaceName?: string;
    /** Configuration of projects within the scope of the workspace. */
    projects: ClangdProjectConfig[];

    /** Query the directory paths of the projects. */
    getClangdProjects(): string[];

    /** Query the names of all distinct contexts across all known projects. */
    getClangdContexts(): string[];

    /**
     * Load the clangd configuration of a project.
     *
     * @param projectConfig a project for which to compute its absolute directory path
     * @returns its clangd configuration
     */
    getClangdConfig(projectConfig: ClangdProjectConfig): ClangdConfig;

    /**
     * Compute the directory that contains the `compile_commands.json` database of the named context of a project.
     *
     * @param projectConfig a project for which to compute a context directory path
     * @param contextName the context name
     * @returns the absolute directory path of the named context in the project
     */
    toContextDir(projectConfig: ClangdProjectConfig, contextName: string): string;
}

class ClangdContextsConfigImpl implements ClangdContextsConfig {
    path: string;
    workspaceName?: string;
    projects: ClangdProjectConfig[];

    constructor(clangdContextsFile: string) {
        try {
            const data = JSON.parse(readFileSync(clangdContextsFile, 'utf8'));
            Object.assign(this, data);
        } catch (e) {
            console.log(`Failed to load ${clangdContextsFile}:`, e);
            throw e;
        }
        this.path = path.dirname(clangdContextsFile);

        this.projects.forEach(this.initProjectConfig.bind(this));
    }

    /**
     * Initialize the defaults in a project configuration.
     *
     * @param projectConfig the context configuration to initialize
     * @returns the initialized context configuration
     */
    private initProjectConfig(projectConfig: ClangdProjectConfig): ClangdProjectConfig {
        if (!projectConfig.contextDirs) {
            projectConfig.contextDirs = 'flat';
        }
        return projectConfig;
    }

    getClangdProjects(): string[] {
        return this.projects.map(proj => path.resolve(this.path, proj.path));
    }

    getClangdContexts(): string[] {
        const result: Set<string> = new Set();

        this.projects.forEach(proj => {
            const projPath = path.resolve(this.path, proj.path);

            if (proj.contextDirs === 'flat') {
                this.collectFlatClangdContexts(projPath, result);
            } else {
                this.collectNestedClangdContexts(projPath, result);
            }
        });

        return Array.from(result);
    }

    getClangdConfig(projectConfig: ClangdProjectConfig): ClangdConfig {
        return loadOrCreate(path.join(this.path, projectConfig.path));
    }

    toContextDir(projectConfig: ClangdProjectConfig, contextName: string): string {
        return path.join(this.path, projectConfig.path, contextName);
    }

    private collectFlatClangdContexts(projectDir: string, contexts: Set<string>): void {
        const listing = isDirectory(projectDir) ? readdirSync(projectDir) : [];
        listing.forEach(entry => {
            const contextDir = path.join(projectDir, entry);
            if (isDirectory(contextDir)) {
                // Does it have a compilation database?
                const ccFile = path.join(contextDir, COMPILE_COMMANDS_FILE);
                if (existsSync(ccFile)) {
                    contexts.add(entry);
                }
            }
        });
    }

    private collectNestedClangdContexts(projectDir: string, contexts: Set<string>): void {
        this.collectNestedClangdContextsRecursive(projectDir, [], contexts);
    }

    private collectNestedClangdContextsRecursive(projectRoot: string, contextPath: string[], contexts: Set<string>): void {
        const possibleContextDir = path.join(...contextPath);
        const qualifiedContextDir = path.join(projectRoot, ...contextPath);

        // Use a uniform, POSIX-like segmentation of the path on all platforms, including Windows
        const possibleContextName = toPortablePath(possibleContextDir);

        // Check for compilation database in a context below the root. At the root, the context name would be empty
        const ccFile = path.join(qualifiedContextDir, COMPILE_COMMANDS_FILE);
        if (contextPath.length > 0 && existsSync(ccFile)) {
            // This is a context directory
            contexts.add(possibleContextName);
        }

        if (isDirectory(qualifiedContextDir)) {
            // Look deeper for context directories
            const listing = readdirSync(qualifiedContextDir);
            listing.forEach(entry => {
                const nestedDir = path.join(qualifiedContextDir, entry);
                if (isDirectory(nestedDir)) {
                    this.collectNestedClangdContextsRecursive(projectRoot, [...contextPath, entry], contexts);
                }
            });
        }
    }
}

/**
 * Find and load the `.clangd-contexts` file that configures clangd contexts for projects in the given
 * `directory`. Searches that `directory` and up its parent chain until a `.clangd-contexts`
 * file is found or else the search is exhausted.
 *
 * @param directory the directory in which to search for the `.clangd-contexts` file
 * @returns the loaded `.clangd-contexts` configuration if it is found
 */
export function getClangdContextsConfig(directory: string): ClangdContextsConfig | undefined {
    for (; ;) {
        const maybeConfig = path.join(directory, CONFIG_FILE);
        if (existsSync(maybeConfig)) {
            const result = new ClangdContextsConfigImpl(maybeConfig);
            return result;
        }

        // Continue searching up the directory hierarchy
        const parent = path.dirname(directory);
        if (parent === directory) {
            // This happens at the root
            break;
        } else {
            directory = parent;
        }
    }

    return undefined;
}
