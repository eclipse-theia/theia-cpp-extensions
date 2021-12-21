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
import * as yaml from 'js-yaml';
import { isFile, toConfigPath } from './util/file-util';

/**
 * An exception in loading, saving, or otherwise processing a `.clangd` configuration file.
 * It usually encapsulates a causal exception providing details of the failed operation.
 */
export class ClangdConfigException extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
    }
};

/** Description of a project configuration as encoded in a `.clangd` file. */
export interface ClangdConfig {
    CompileFlags: CompileFlags;
    filePath: string;
}

/** Representation of the compile flags property of the `.clangd` configuration. */
export interface CompileFlags {
    Add?: string | string[];
    Remove?: string | string[];
    CompilationDatabase?: string;
}

/** The name of the project's clangd configuration file to which we apply a clangd context. */
export const CONFIG_FILE_NAME = '.clangd';

/**
 * If a `.clangd` configuration file at the given path exists, load it into a {@link ClangdConfig}.
 *
 * @param configPath path to the clangd configuration file or its parent directory.
 * @returns the loaded {@link ClangdConfig} or `undefined` if the configuration file does not exist
 * @throws {@link ClangdConfigException} on error in reading the configuration file or parsing its content
 */
export function load(configPath: string): ClangdConfig | undefined {
    const configurationFile = toConfigPath(configPath);
    if (!isFile(configurationFile)) {
        return undefined;
    }

    try {
        const config = yaml.load(fs.readFileSync(configurationFile, 'utf8'));
        if (config && typeof config === 'object') {
            return createClangdConfig(configurationFile, config);
        }
    } catch (e) {
        // load throws YAMLException
        throw new ClangdConfigException('Error parsing YAML content.', e);
    }

    return undefined;
}

/**
 * Create a new `ClangdConfig` object.
 *
 * @param configurationFile the configuration file from which the configuration was loaded or to which it will be written
 * @param configurationData the configuration data loaded from the `configurationFile`, if any. This is generically typed
 *  because it is usually loaded from YAML and may contain data used by clangd that is not managed by this API
 * @returns a new clangd configuration object
 */
function createClangdConfig(configurationFile: string, configurationData?: object): ClangdConfig {
    const result = { CompileFlags: {}, filePath: configurationFile };
    if (configurationData) {
        Object.assign(result, configurationData);
    }
    return result;
}

/**
 * If a `.clangd` configuration file at the given path exists, load it into a {@link ClangdConfig},
 * or else create a new empty {@link ClangdConfig}. A new empty _file_ is not created; be sure not
 * to {@link save} an empty configuration using the result.
 *
 * @param configPath path to the clangd configuration file or its parent directory
 * @returns the loaded or new {@link ClangdConfig}
 * @throws {@link ClangdConfigException} on error in reading an existing configuration file or parsing its content
 *
 * @see {@link load}, {@link save}
 */
export function loadOrCreate(configPath: string): ClangdConfig {
    const configurationFile = toConfigPath(configPath);

    // Propagate the exception from load, if any
    const config = load(configurationFile) ?? createClangdConfig(configurationFile);
    return config;
}

/**
 * Write the content of a given {@link ClangdConfig} to its {@link ClangdConfig.filePath source file}.
 *
 * @param config a clangd configuration to save
 * @throws {@link ClangdConfigException} on failure to save the config file
 */
export function save(config: ClangdConfig): void {
    const filePath = config.filePath;
    if (!filePath) {
        throw new ClangdConfigException('Could not save config. No "filePath" has been defined.');
    }

    // Do not persist the filePath property.
    const { filePath: SourceFile, ...persistableConfig } = config;
    const configContent = yaml.dump(persistableConfig, { noArrayIndent: true });

    try {
        fs.writeFileSync(filePath, configContent, 'utf8');
    } catch (e) {
        throw new ClangdConfigException('Failed to save config.', e);
    }
}
