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

import { getContext, load, setContext, setCompileFlags, unsetCompileFlags, selectContext, ClangdContextsConfig, getClangdContextsConfig, loadOrCreate, forAllProjects } from '.';
import { expect, use } from 'chai';
import * as fs from 'fs';
import * as paths from 'path';
import { createTmpDir, tmpFile } from './common.spec';

/* eslint-disable no-unused-expressions */
use(require('chai-string'));

describe('clangd-context', function (): void {
    const debug = 'DEBUG';
    const release = 'RELEASE';
    let configFile: string;
    let project: string;

    this.beforeAll(createTmpDir);

    this.beforeEach(function (): void {
        configFile = tmpFile('app/.clangd', path => `CompileFlags:
    CompilationDatabase: ${paths.resolve(path, '..', debug)}
`);
        project = paths.dirname(configFile);
        tmpFile(`app/${debug}/compile_commands.json`);
        tmpFile(`app/${release}/compile_commands.json`);
    });

    describe('getContext', function (): void {
        it('get context from .clangd file', function (): void {
            const context = getContext(configFile)!;
            expect(context.name).to.equal(debug);
            expect(context.compilationDatabase).to.equal(paths.resolve(project, debug));
        });
    });

    describe('setContext', function (): void {
        it('set context into .clangd file', function (): void {
            const contextDir = paths.resolve(project, release);
            setContext(configFile, contextDir);

            const content = fs.readFileSync(configFile, 'utf8');
            expect(content).to.have.string(contextDir);
        });
    });

    describe('setCompileFlags', function (): void {
        it('set removed flags', function (): void {
            setCompileFlags(configFile, undefined, ['-a', '-b', '-c']);

            const context = load(configFile);
            expect(context?.CompileFlags.Remove).to.have.members(['-a', '-b', '-c']);
            expect(context?.CompileFlags.Add).to.be.undefined;
        });

        it('set added flags', function (): void {
            setCompileFlags(configFile, ['-a', '-b', '-c']);

            const context = load(configFile);
            expect(context?.CompileFlags.Add).to.have.members(['-a', '-b', '-c']);
            expect(context?.CompileFlags.Remove).to.be.undefined;
        });

        it('set both kinds of flags', function (): void {
            setCompileFlags(configFile, ['-a', '-b', '-c'], ['-u', '-v']);

            const context = load(configFile);
            expect(context?.CompileFlags.Add).to.have.members(['-a', '-b', '-c']);
            expect(context?.CompileFlags.Remove).to.have.members(['-u', '-v']);
        });
    });

    describe('unsetCompileFlags', function (): void {
        this.beforeEach(function (): void {
            configFile = tmpFile('app/.clangd', path => `CompileFlags:
    Add:
        - -a
        - -b
        - -c
    Remove:
        - -u
        - -v
    CompilationDatabase: ${paths.resolve(path, '..', debug)}
`);
        });

        it('unset removed flags', function (): void {
            unsetCompileFlags(configFile, ['-u']);

            const context = load(configFile);
            expect(context?.CompileFlags.Remove).to.have.members(['-v']);
        });

        it('unset added flags', function (): void {
            unsetCompileFlags(configFile, ['-b']);

            const context = load(configFile);
            expect(context?.CompileFlags.Add).to.have.members(['-a', '-c']);
        });

        it('unset all flags', function (): void {
            unsetCompileFlags(configFile, ['-a', '-b', '-c', '-u', '-v']);

            const context = load(configFile);
            expect(context?.CompileFlags.Add).to.be.undefined;
            expect(context?.CompileFlags.Remove).to.be.undefined;
        });
    });

    describe('workspace-aware functions', function (): void {
        let workspaceConfigFile: string;
        let workspaceConfig: ClangdContextsConfig;
        let appProject: string;
        let libProject: string;

        this.beforeAll(function (): void {
            workspaceConfigFile = tmpFile('.clangd-contexts',
                `{
"workspaceName": "Test Workspace",
"projects": [
    {
        "path": "app",
        "contextDirs": "flat"
    },
    {
        "path": "lib",
        "contextDirs": "flat"
    }
]
}`);

            tmpFile(`app/${debug}/compile_commands.json`, '');
            tmpFile(`app/${release}/compile_commands.json`, '');
            tmpFile(`lib/${debug}/compile_commands.json`, '');
            tmpFile(`lib/${release}/compile_commands.json`, '');

            workspaceConfig = getClangdContextsConfig(workspaceConfigFile)!;
            appProject = paths.join(workspaceConfig.path, 'app');
            libProject = paths.join(workspaceConfig.path, 'lib');
        });

        it('selectContext', function (): void {
            selectContext(workspaceConfig, release);

            const appContext = loadOrCreate(appProject);
            expect(appContext.CompileFlags.CompilationDatabase).to.have.string(release);
            const libContext = loadOrCreate(libProject);
            expect(libContext.CompileFlags.CompilationDatabase).to.have.string(release);
        });

        it('forAllProjects', function (): void {
            const names: string[] = [];

            forAllProjects(workspaceConfig, proj => names.push(typeof proj === 'string' ? proj : proj.filePath));
            expect(names).to.have.members([appProject, libProject]);
        });
    });
});
