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
import { setContext } from '@theia/clangd-contexts';
import { validateAndResolveContextDirectory, validateAndResolveConfig } from './validation';

const program = new Command()
    .name('set-context')
    .showHelpAfterError(true)
    .description('Set or change the clangd context for a given project')
    .argument(
        '<project>',
        'The project directory (or .clangd file) for which the clangd context should be set',
        value => validateAndResolveConfig(value, true)
    )
    .requiredOption(
        '-c, --compile-commands <ccPath>',
        'The path to the compilation database or its parent directory',
        validateAndResolveContextDirectory
    );

program.parse();
const options = program.opts();
const directory = program.processedArgs[0];

setContext(directory, options.compileCommands);
