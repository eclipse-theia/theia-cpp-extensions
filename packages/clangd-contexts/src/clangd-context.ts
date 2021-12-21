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

import * as path from 'path';
import { ClangdConfig, load, loadOrCreate, save } from './clangd-config';
import { ClangdContextsConfig } from './clangd-contexts-config';
import { isDirectory } from './util/file-util';
import { asArray } from './util/maybe-array';

/** Description of a clangd context. */
export interface ClangdContext {
    name: string;
    compilationDatabase: string;
}

/**
 * Set the context selected in a project. The `.clangd` file will be updated to
 * refer to the given context's compilation database.
 *
 * @param configurationInput the clangd configuration to update, either the `.clangd` file's path or its content
 * @param contextDirectory the directory that contains the compilation database file
 * @throws {@link ClangdConfigException} on error in saving the updated configuration file
 */
export function setContext(configurationInput: string | ClangdConfig, contextDirectory: string): void {
    const configuration = typeof configurationInput === 'string' ? loadOrCreate(configurationInput) : configurationInput;
    configuration.CompileFlags.CompilationDatabase = contextDirectory;
    save(configuration);
}

/**
 * Retrieve the active context of the given `.clangd` configuration file.
 *
 * @param configPath the clangd context file to read
 * @return the context-relevant content of the file, or `undefined` if the file does not exist
 * @throws {@link ClangdConfigException} on error in loading an existing configuration file
 */
export function getContext(configPath: string): ClangdContext | undefined {
    const config = load(configPath);

    if (config && config.CompileFlags.CompilationDatabase) {
        return {
            name: path.relative(path.dirname(config.filePath), config.CompileFlags.CompilationDatabase),
            compilationDatabase: config.CompileFlags.CompilationDatabase,
        };
    }

    return undefined;
}

/**
 * In the given `.clangd` file, specify flags to add to and/or remove from invocations of the `clang` compiler
 * in clangd's analysis.
 *
 * @param configurationInput the clangd configuration to update, either the `.clangd` file path or its content
 * @param addFlags an optional array of flags to add to the list of flags added to the `clang` command-line
 * @param removeFlags an optional array of flags to add to the list of flags removed from the `clang` command-line
 * @throws {@link ClangdConfigException} on error in saving the updated configuration file
 */
export function setCompileFlags(configurationInput: string | ClangdConfig, addFlags?: string[], removeFlags?: string[]): void {
    const configuration = typeof configurationInput === 'string' ? loadOrCreate(configurationInput) : configurationInput;

    if (addFlags) {
        configuration.CompileFlags.Add = includeFlags(addFlags, configuration.CompileFlags.Add);
    }
    if (removeFlags) {
        configuration.CompileFlags.Remove = includeFlags(removeFlags, configuration.CompileFlags.Remove);
    }

    save(configuration);
}

/**
 * Remove from the given `.clangd` file some flags that are currently added or removed from invocations of the `clang` compiler
 * in clangd's analysis. In the `.clangd` file, any given flag will generally be either in the `Add` list or the `Remove` list.
 * This function ensures that the flags specified will not appear in either list in the updated `.clangd` file.
 *
 * @param configurationInput the clangd configuration to update, either the `.clangd` file path or its content
 * @param flags an optional array of flags to remove from the lists of flags added to and removed from the `clang` command-line
 * @throws {@link ClangdConfigException} on error in saving the updated configuration file
 */
export function unsetCompileFlags(configurationInput: string | ClangdConfig, flags?: string[]): void {
    const configuration = typeof configurationInput === 'string' ? loadOrCreate(configurationInput) : configurationInput;

    if (flags && configuration.CompileFlags.Add) {
        configuration.CompileFlags.Add = excludeFlags(flags, configuration.CompileFlags.Add);
        if (configuration.CompileFlags.Add.length === 0) {
            delete configuration.CompileFlags.Add;
        }
    }
    if (flags && configuration.CompileFlags.Remove) {
        configuration.CompileFlags.Remove = excludeFlags(flags, configuration.CompileFlags.Remove);
        if (configuration.CompileFlags.Remove.length === 0) {
            delete configuration.CompileFlags.Remove;
        }
    }

    save(configuration);
}

/**
 * Ensure that an array of flags includes some required flags.
 *
 * @param newFlags flags to ensure are included along with the `currentFlags`
 * @param currentFlags an existing single flag or array of flags
 * @returns a new array based on the `currentFlags` that includes the `newFlags`
 */
function includeFlags(newFlags: string[], currentFlags?: string | string[]): string[] {
    const base = asArray(currentFlags ?? []);
    return Array.from(new Set(base.concat(newFlags)));
}

/**
 * Ensure that an array of flags does not include some unwanted flags.
 *
 * @param flagsToRemove flags to ensure are excluded from the array of `currentFlags`
 * @param currentFlags an existing single flag or array of flags
 * @returns a new array based on the `currentFlags` that does not include any of the `flagsToRemove`
 */
function excludeFlags(flagsToRemove: string[], currentFlags?: string | string[]): string[] {
    const result = new Set(asArray(currentFlags ?? []));
    flagsToRemove.forEach(flag => result.delete(flag));
    return Array.from(result);
}

/**
 * Activate a named context in all of the projects that have a context of that name.
 * Any project that does not have the context is left unchanged.
 *
 * @param contextsConfig the projects from the `.clangd-contexts` file
 * @param contextName the context to active in the projects
 */
export function selectContext(contextsConfig: ClangdContextsConfig, contextName: string): void {
    contextsConfig.projects.forEach(proj => {
        const configDir = contextsConfig.toContextDir(proj, contextName);

        // Not necessarily every project actually has this context defined
        if (isDirectory(configDir)) {
            setContext(contextsConfig.getClangdConfig(proj), configDir);
        }
    });
}

/**
 * List the distinct context names across all projects.
 *
 * @param contextsConfig the clangd workspace configuration from the `.clangd-contexts` file
 */
export function listContexts(contextsConfig: ClangdContextsConfig): void {
    contextsConfig.getClangdContexts().forEach(context => console.log(context));
}

/**
 * List the projects in the workspace.
 *
 * @param contextsConfig the clangd workspace configuration from the `.clangd-contexts` file
 * @param baseDir a directory relative to which the output directory paths are deresolved. For example, in a
 *   CLI tool this might be the current working directory. If omitted, absolute paths are output
 */
export function listProjects(contextsConfig: ClangdContextsConfig, baseDir?: string): void {
    const deresolve: (p: string) => string = baseDir ? p => {
        const outputPath = path.relative(baseDir, p);
        const normalizedOutputPath = outputPath === '' ? '.' : outputPath;
        return normalizedOutputPath + path.sep;
    } : p => path.resolve(contextsConfig.path, p);

    forAllProjects(contextsConfig, proj => {
        const projectPath = typeof proj === 'string' ? proj : path.dirname(proj.filePath);
        const outputPath = deresolve(projectPath);
        console.log(outputPath);
    });
}

/**
 * Perform some action on all valid project directories.
 *
 * @param contextsConfig the clangd workspace configuration from the `.clangd-contexts` file
 * @param action an action to perform on each project directory
 */
export function forAllProjects(contextsConfig: ClangdContextsConfig, action: (configurationInput: string | ClangdConfig) => void): void {
    contextsConfig.getClangdProjects().forEach(project => {
        if (isDirectory(project)) {
            action(project);
        }
    });
}
