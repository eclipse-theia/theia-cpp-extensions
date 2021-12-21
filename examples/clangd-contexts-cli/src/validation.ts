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
import * as path from 'path';
import { exit } from 'process';
import { COMPILE_COMMANDS_FILE, ClangdContextsConfig, CONFIG_FILE_NAME, getClangdContextsConfig, isDirectory, isFile } from '@theia/clangd-contexts';

/**
 * Validate the given file string and resolve it to a normalized absolute path.
 * Prints an error and exits the application if the given
 * string is not a valid, existing file.
 *
 * @param value a path string to validate
 * @returns the validated and resolved file
 */
export function validateAndResolveFile(value: string): string {
    if (!isFile(value)) {
        console.error(`Invalid argument: '${value}' is not a valid, existing file path.`);
        exit(1);
    }

    return path.resolve(value);
}

/**
 * Validate the given directory string and resolve it to a normalized absolute path.
 * Prints an error and exits the application if the given
 * string is not a valid, existing directory.
 *
 * @param value a path string to validate
 * @returns the validated and resolved directory
 */
export function validateAndResolveDirectory(value: string): string {
    if (!isDirectory(value)) {
        console.error(`Invalid argument: '${value}' is not a valid, existing directory path.`);
        exit(1);
    }

    return path.resolve(value);
}

/**
 * Validate and resolve the given `.clangd` path string.
 * Prints an error and exits the application if the given string is not a
 * valid `.clangd` file or a valid, existing directory containing a `.clangd` file.
 *
 * @param value a path string to validate
 * @param [lax] whether to accept a directory that does not contain a `.clang` file. By default,
 *   the `.clangd` file is required (`lax = false`)
 * @returns the validated and resolved directory containing the `.clangd` configuration file
 *
 * @see validateAndResolveFile
 * @see validateAndResolveDirectory
 */
export function validateAndResolveConfig(value: string, lax = false): string {
    if (path.basename(value) === CONFIG_FILE_NAME) {
        const configFile = validateAndResolveFile(value);
        return path.dirname(configFile);
    }

    let result = validateAndResolveDirectory(value);
    if (fs.readdirSync(value).includes(CONFIG_FILE_NAME)) {
        value = path.join(value, CONFIG_FILE_NAME);
        result = validateAndResolveFile(value);
    } else if (!lax) {
        console.error(`Invalid argument: the directory '${value}' does not contain a ${CONFIG_FILE_NAME} file.`);
        exit(1);
    }
    return result;
}

/**
 * Validate and resolve the given context path string.
 * Prints an error and exits the application if the given
 * string is not a valid `compile_commands.json` file or a valid, existing directory containing
 * a `compile_commands.json` file.
 *
 * @param value a path string to validate as a compilation database directory
 * @returns the validated and resolved compilation database directory
 *
 * @see validateAndResolveFile
 * @see validateAndResolveDirectory
 */
export function validateAndResolveContextDirectory(value: string): string {
    if (path.basename(value) === COMPILE_COMMANDS_FILE) {
        const configFile = validateAndResolveFile(value);
        return path.dirname(configFile);
    }

    const result = validateAndResolveDirectory(value);
    if (!fs.readdirSync(value).includes(COMPILE_COMMANDS_FILE)) {
        console.error(
            `Invalid argument: the directory '${value}' is not a valid context directory.
             It does not contain a ${COMPILE_COMMANDS_FILE} file.`
        );
        exit(1);
    }
    return result;
}

/**
 * Validate the given context name string. Prints an error and exits the application if the given string is not the
 * name of a known context directory in the projects configured in the  `.clangd-contexts` file.
 *
 * @param value a path string to validate as a clangd context name
 * @param contextsConfig the current contexts configuration, if there is one
 * @returns the validated clangd context name
 */
export function validateContextName(value: string, contextsConfig?: ClangdContextsConfig): string {
    const configurations = requireContextsConfig(contextsConfig).getClangdContexts();

    if (!configurations.includes(value)) {
        console.error(`No such context "${value}" is defined.`);
        exit(1);
    }

    return value;
}

/**
 * Ensure that the `.clangd-contexts` file is loaded. If the `contextsConfig` is `undefined`, then
 * it is sought and loaded. If that fall-back fails, then exit the CLI with an error code. Thus, this
 * operation can only return normally.
 *
 * @param contextsConfig an optional already-loaded `.clangd-contexts` configuration
 * @returns the `contextsConfig` if it was already loaded, otherwise a freshly loaded `.clangd-contexts` configuration
 */
export function requireContextsConfig(contextsConfig?: ClangdContextsConfig): ClangdContextsConfig {
    const result = contextsConfig ?? getClangdContextsConfig(process.cwd());

    if (!result) {
        console.error('No .clangd-contexts file found. Configuration must be set explicitly in each project.');
        exit(1);
    }

    return result;
}

/**
 * Collect a list of `clang` flags that are the value of a command-line option into an aggregate
 * of all such lists parsed from the same option. Additionally, any flags that are not preceded
 * by a hyphen (dash) are prepended with a hyphen.
 *
 * @param value the comma-separated list of tokens to parse as an array of `clang` flags
 * @param previousValue the array of tokens parsed so far for the flags (for the same command-line option)
 * @param compileFlags flags in the `clang` command-line
 * @returns the collected and dashified flags
 */
export function collectFlags(value: string, previousValue?: string[]): string[] {
    let result = previousValue ?? [];
    result = result.concat(ensureLeadingDash(value.split(/\s*,\s*/)));
    return result;
}

/**
 * Add the leading `-` to any flags that do not already have it.
 *
 * @param compileFlags flags in the `clang` command-line
 * @returns the dashified flags
 */
function ensureLeadingDash(compileFlags: string[]): string[] {
    return compileFlags.map(flag => (flag.startsWith('-') ? flag : `-${flag}`));
}
