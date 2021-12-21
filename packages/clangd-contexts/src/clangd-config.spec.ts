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

import { ClangdConfigException, load, loadOrCreate, save } from './clangd-config';
import { expect, use } from 'chai';
import * as fs from 'fs';
import { createTmpDir, tmpFile } from './common.spec';
import { ClangdConfig } from '.';
import { fail } from 'assert';

/* eslint-disable no-unused-expressions */
use(require('chai-string'));

describe('clangd-config', function (): void {
    this.beforeAll(createTmpDir);

    describe('load', function (): void {
        let clangdFile: string;

        this.beforeEach(function (): void {
            clangdFile = tmpFile('.clangd',
                `CompileFlags:
    CompilationDatabase: >-
        /home/me/clangd-workspace/app/Debug_x86-64
`);
        });

        it('load a simple config file', function (): void {
            const simpleContent = load(clangdFile);
            expect(simpleContent?.filePath).to.equal(clangdFile);
            expect(simpleContent?.CompileFlags.CompilationDatabase).to.equal('/home/me/clangd-workspace/app/Debug_x86-64');
            expect(simpleContent?.CompileFlags.Add).to.be.undefined;
            expect(simpleContent?.CompileFlags.Remove).to.be.undefined;
        });

        it('load a non-existent config file', function (): void {
            const nonExistent = load('no/such/.clangd');
            expect(nonExistent).to.be.undefined;
        });

        it('loadOrCreate an existing file', function (): void {
            const simpleContent = loadOrCreate(clangdFile);
            expect(simpleContent.filePath).to.equal(clangdFile);
            expect(simpleContent.CompileFlags.CompilationDatabase).to.equal('/home/me/clangd-workspace/app/Debug_x86-64');
            expect(simpleContent.CompileFlags.Add).to.be.undefined;
            expect(simpleContent.CompileFlags.Remove).to.be.undefined;
        });

        it('loadOrCreate a non-existent existing file', function (): void {
            const simpleContent = loadOrCreate('no/such/.clangd');
            expect(simpleContent.filePath).to.have.string('no/such/.clangd');
            expect(simpleContent.CompileFlags.CompilationDatabase).to.be.undefined;
            expect(simpleContent.CompileFlags.Add).to.be.undefined;
            expect(simpleContent.CompileFlags.Remove).to.be.undefined;
        });

        it('load a malformed YAML file', function (): void {
            const invalidClangdFile = tmpFile('.clangd', 'This: \'is not valid YAML content.');

            try {
                const invalidContent = load(invalidClangdFile);
                fail(`Should have thrown ClangdConfigException instead of getting ${invalidContent}`);
            } catch (e) {
                expect(e).to.be.an.instanceOf(ClangdConfigException);
                const ex = e as ClangdConfigException;
                expect(ex.cause).to.exist;
            }
        });
    });

    describe('save', function (): void {
        let clangdFile: string;

        this.beforeEach(function (): void {
            clangdFile = tmpFile('.clangd');
        });

        it('create a simple config file', function (): void {
            const config: ClangdConfig = {
                filePath: clangdFile,
                CompileFlags: {
                    CompilationDatabase: '/home/me/clangd-workspace/app/Release_x86-64'
                }
            };
            save(config);
            const simpleContent = fs.readFileSync(clangdFile, 'utf8');
            expect(simpleContent).to.have.string('CompilationDatabase:');
            expect(simpleContent).to.have.string('Release_x86-64');
            expect(simpleContent).not.to.have.string('mocha', 'SourceFile path was stored');
        });
    });
});
