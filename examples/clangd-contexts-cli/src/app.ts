#!/usr/bin/env node
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

/*
 * The entry point for the clangd-context CLI application.
 */
const program = new Command()
    .name('clangd-context')
    .showHelpAfterError(true)
    .command('get-context', 'get the context in a project configuration', { executableFile: 'get-context-cmd' })
    .command('set-context', 'set or change the context in a project configuration', {
        executableFile: 'set-context-cmd',
    })
    .command('list', 'list the projects in the clangd workspace', { executableFile: 'list-cmd' })
    .command('list-contexts', 'list the contexts of the projects in the clangd workspace', {
        executableFile: 'list-contexts-cmd',
    })
    .command('select-context', 'select a context to activate in every project in the workspace', {
        executableFile: 'select-context-cmd',
    })
    .command('set-flags', 'set added/removed compile flags in a project', { executableFile: 'set-flags-cmd' })
    .command('unset-flags', 'unset added/removed compile flags in a project', { executableFile: 'unset-flags-cmd' });

program.parse(process.argv);
