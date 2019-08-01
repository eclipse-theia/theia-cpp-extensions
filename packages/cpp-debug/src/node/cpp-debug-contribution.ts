/********************************************************************************
 * Copyright (C) 2018 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable } from 'inversify';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-common';
import { AbstractVSCodeDebugAdapterContribution } from '@theia/debug/lib/node/vscode/vscode-debug-adapter-contribution';
import { join } from 'path';
import * as Ajv from 'ajv';

const adapterName = 'gdb';
const adapterPath = join(__dirname, '../../download/cdt-gdb-vscode/package');

// Load schema from package.json
const packageJson = require(join(adapterPath, 'package.json'));
// tslint:disable-next-line:no-any
const CppDebugConfigurationSchema = packageJson.contributes.debuggers.filter((e: any) => e.type === adapterName)[0].configurationAttributes;

export namespace cppDebugConfigurationValidators {
    export const Launch = new Ajv().compile(CppDebugConfigurationSchema.launch);
    export const Attach = new Ajv().compile(CppDebugConfigurationSchema.attach);
}

@injectable()
export class GdbDebugAdapterContribution extends AbstractVSCodeDebugAdapterContribution {

    constructor() {
        super(
            adapterName,
            adapterPath
        );
    }

    async resolveDebugConfiguration(config: DebugConfiguration, workspaceFolderUri?: string): Promise<DebugConfiguration | undefined> {

        switch (config.request) {
            case 'launch': return this.validateConfiguration(cppDebugConfigurationValidators.Launch, config);
            case 'attach': return this.validateConfiguration(cppDebugConfigurationValidators.Attach, config);
        }

        throw new Error(`unknown request: "${config.request}"`);
    }

    protected validateConfiguration(validator: Ajv.ValidateFunction, config: DebugConfiguration): DebugConfiguration {
        if (!validator(config)) {
            throw new Error(validator.errors!.map(e => e.message).join(' // '));
        }
        return config;
    }
}
