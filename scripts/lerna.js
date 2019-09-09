/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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
// @ts-check
const path = require('path');

const lernaPath = path.resolve(__dirname, '..', 'node_modules', 'lerna', 'bin', 'lerna');

if (process.platform === 'win32') {
    console.log('Parallel lerna execution is disabled on Windows. Falling back to sequential execution with the \'--concurrency=1\' flag.');
    if (process.argv.indexOf('--concurrency=1') === -1) {
        process.argv.push('--concurrency=1');
    }
    const parallelIndex = process.argv.indexOf('--parallel');
    if (parallelIndex !== -1) {
        process.argv[parallelIndex] = '--stream';
    }
    console.log('Running lerna as: ' + process.argv.join(' '));
}
if (process.argv.indexOf('--reject-cycles') === -1) {
    process.argv.push('--reject-cycles');
}
require(lernaPath);
