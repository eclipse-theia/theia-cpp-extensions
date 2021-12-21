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
import { selectContext, getClangdContextsConfig } from '@theia/clangd-contexts';
import { validateContextName, requireContextsConfig } from './validation';

const contextsConfig = getClangdContextsConfig(process.cwd());

const program = new Command()
    .name('select-context')
    .showHelpAfterError(true)
    .description('Select a context to activate in every project in the clangd workspace')
    .argument('<context>', 'The name of the context to select', value => validateContextName(value, contextsConfig));

program.parse();
const contextName = program.processedArgs[0];

selectContext(requireContextsConfig(contextsConfig), contextName);
