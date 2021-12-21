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

import { Command } from 'commander';
import { forAllProjects, unsetCompileFlags } from '@theia/clangd-contexts';
import { validateAndResolveConfig, collectFlags, requireContextsConfig } from './validation';

const program = new Command()
    .name('unset-flags')
    .showHelpAfterError(true)
    .description('Forget compile flags that previously were set as added or removed in a clangd configuration')
    .argument('[configPath]', 'Path to the clangd configuration file or its parent directory', validateAndResolveConfig)
    .option(
        '-f, --flags <flags>',
        'Comma-separated list of added/removed compile flags to be deleted from the clangd configuration. The leading "-" of the first flag must be omitted',
        collectFlags
    );

program.parse();
const options = program.opts();
const configPath = program.processedArgs[0];

if (configPath) {
    unsetCompileFlags(configPath, options.flags);
} else {
    forAllProjects(requireContextsConfig(), proj => unsetCompileFlags(proj, options.flags));
}
