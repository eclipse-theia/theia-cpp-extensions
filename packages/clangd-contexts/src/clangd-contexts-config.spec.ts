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

import { getClangdContextsConfig } from '.';
import { expect, use } from 'chai';
import * as paths from 'path';
import * as mkdirp from 'mkdirp';
import * as os from 'os';
import { createTmpDir, tmpFile } from './common.spec';
import rimraf = require('rimraf');

/* eslint-disable no-unused-expressions */
use(require('chai-string'));

describe('clangd-contexts-config', function (): void {
    let configFile: string;

    this.beforeAll(createTmpDir);

    this.beforeEach(function (): void {
        configFile = tmpFile('.clangd-contexts',
            `{
"workspaceName": "Theia Clangd Contexts Test",
"projects": [
    {
        "path": "app",
        "contextDirs": "nested"
    },
    {
        "path": "lib",
        "contextDirs": "flat"
    }
]
}`);
    });

    describe('getClangdContextsConfig', function (): void {
        it('load a simple config file', function (): void {
            const simpleConfig = getClangdContextsConfig(configFile);
            expect(simpleConfig?.path).to.equal(paths.dirname(configFile));
            expect(simpleConfig?.workspaceName).to.equal('Theia Clangd Contexts Test');
            expect(simpleConfig?.projects).to.have.nested.property('[0].contextDirs', 'nested');
            expect(simpleConfig?.projects).to.have.nested.property('[1].path', 'lib');
        });

        it('search up the parent directories', function (): void {
            const cwd = paths.resolve(configFile, '..', 'some', 'nested', 'dir');
            mkdirp.sync(cwd);
            const simpleConfig = getClangdContextsConfig(cwd);
            expect(simpleConfig?.path).to.equal(paths.dirname(configFile));
        });

        it('load a non-existent config file', function (): void {
            const simpleConfig = getClangdContextsConfig(os.tmpdir());
            expect(simpleConfig).to.be.undefined;
        });
    });

    describe('ClangdContextsConfig', function (): void {
        this.afterEach(function (): void {
            rimraf.sync(paths.resolve(configFile, '..', 'app'));
            rimraf.sync(paths.resolve(configFile, '..', 'lib'));
        });

        it('getClangdProjects', function (): void {
            const projects = getClangdContextsConfig(configFile)?.getClangdProjects();
            const absoluteDirs = ['app', 'lib'].map(dir => paths.resolve(configFile, '..', dir));
            expect(projects).to.have.members(absoluteDirs);
        });

        it('getClangdContexts (no contexts)', function (): void {
            const contexts = getClangdContextsConfig(configFile)?.getClangdContexts();
            expect(contexts).to.be.empty;
        });

        it('getClangdContexts', function (): void {
            // These are nested
            tmpFile('app/Debug/x86-64/compile_commands.json', '');
            tmpFile('app/Release/x86-64/compile_commands.json', '');
            // And these are flat
            tmpFile('lib/Debug_x86-64/compile_commands.json', '');
            tmpFile('lib/Release_x86-64/compile_commands.json', '');
            const contexts = getClangdContextsConfig(configFile)?.getClangdContexts();
            expect(contexts).to.have.members(['Debug/x86-64', 'Release/x86-64', 'Debug_x86-64', 'Release_x86-64']);
        });

        it('getClangdContexts (uniqueness)', function (): void {
            tmpFile('app/Debug_x86-64/compile_commands.json', '');
            tmpFile('app/Release_x86-64/compile_commands.json', '');
            tmpFile('lib/Debug_x86-64/compile_commands.json', '');
            tmpFile('lib/Release_x86-64/compile_commands.json', '');
            const contexts = getClangdContextsConfig(configFile)?.getClangdContexts();
            expect(contexts).to.have.members(['Debug_x86-64', 'Release_x86-64']);
        });
    });
});
