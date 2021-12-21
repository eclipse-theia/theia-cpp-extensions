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
import { getContext, ClangdContext } from '@theia/clangd-contexts';
import { validateAndResolveConfig } from './validation';

/** Placeholder for the empty/undefined clangd context. */
export const NO_CONTEXT: ClangdContext = {
    name: 'NO_CONTEXT',
    compilationDatabase: '',
};

const program = new Command()
    .name('get-context')
    .showHelpAfterError(true)
    .description('Get the clangd context for a given project directory or .clangd file')
    .argument(
        '<project>',
        'The project directory (or .clangd file) for which the clangd context should be retrieved',
        value => validateAndResolveConfig(value, true)
    );

program.parse();
const directory = program.processedArgs[0];

console.log(getContext(directory) ?? NO_CONTEXT);
