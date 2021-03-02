/********************************************************************************
 * Copyright (C) 2021 Ericsson and others.
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

import { injectable, decorate } from 'inversify';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-common';
import { AbstractVSCodeDebugAdapterContribution } from '@theia/debug/lib/node/vscode/vscode-debug-adapter-contribution';
import { join } from 'path';
import * as Ajv from 'ajv';

const adapterPath = join(__dirname, '../../download/cdt-gdb-vscode/package');
const packageJson = require(join(adapterPath, 'package.json'));

// Create contribution classes (multiple debuggers are being contributed here)
export const debugAdapterContributions: Array<{ new(): AbstractVSCodeDebugAdapterContribution }> =

    // `debugger` is a reserved keyword, hence why `d`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (packageJson.contributes.debuggers as any[]).map(d => {

        const validators = {
            Launch: new Ajv().compile(d.configurationAttributes.launch),
            Attach: new Ajv().compile(d.configurationAttributes.attach),
        };

        const GdbAdapterContribution = class extends AbstractVSCodeDebugAdapterContribution {

            constructor() {
                super(
                    d.type,
                    adapterPath,
                );
            }

            /**
             * Resolve the debug configuration.
             * @param config the debug configuration.
             * @param workspaceFolderUri the optional workspace folder uri.
             */
            async resolveDebugConfiguration(config: DebugConfiguration, workspaceFolderUri?: string): Promise<DebugConfiguration | undefined> {

                switch (config.request) {
                    case 'launch': return this.validateConfiguration(validators.Launch, config);
                    case 'attach': return this.validateConfiguration(validators.Attach, config);
                }

                throw new Error(`unknown request: "${config.request}"`);
            }

            /**
             * Validate the debug configuration.
             * @param validator the validator function.
             * @param config the debug configuration.
             */
            protected validateConfiguration(validator: Ajv.ValidateFunction, config: DebugConfiguration): DebugConfiguration {
                if (!validator(config)) {
                    throw new Error(validator.errors!.map((error: Ajv.ErrorObject) => error.message).join(' // '));
                }
                return config;
            }

        };

        decorate(injectable, GdbAdapterContribution);
        return GdbAdapterContribution;

    });
