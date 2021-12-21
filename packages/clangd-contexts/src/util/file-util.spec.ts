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

import { isFile, isDirectory, toConfigPath, toPortablePath } from './file-util';
import { expect, use } from 'chai';

import * as paths from 'path';

use(require('chai-string'));

/* eslint-disable no-unused-expressions */
describe('file-util', function (): void {
    describe('isFile', function (): void {
        it('handles files and directories that exist', function (): void {
            const fromFile = isFile('package.json');
            expect(fromFile).to.be.true;

            const fromDirectory = isFile(fromPortablePath('src/util'));
            expect(fromDirectory).to.be.false;
        });

        it('handles paths that do not exist', function (): void {
            const fromMissing = isFile(fromPortablePath('src/no/such/path'));
            expect(fromMissing).to.be.false;
        });
    });

    describe('isDirectory', function (): void {
        it('handles files and directories that exist', function (): void {
            const fromFile = isDirectory('package.json');
            expect(fromFile).to.be.false;

            const fromDirectory = isDirectory(fromPortablePath('src/util'));
            expect(fromDirectory).to.be.true;
        });

        it('handles paths that do not exist', function (): void {
            const fromMissing = isDirectory(fromPortablePath('src/no/such/path'));
            expect(fromMissing).to.be.false;
        });
    });

    describe('toConfigPath', function (): void {
        it('handles exact file', function (): void {
            const fromExactFile = toConfigPath(fromPortablePath('some/path/.clangd'));
            expect(fromExactFile).to.equal(fromPortablePath('some/path/.clangd'));
        });

        // With a directory input, the result is resolved to an absolute path
        it('handles directory', function (): void {
            const fromDirectory = toConfigPath(fromPortablePath('some/path'));
            expect(fromDirectory).to.endWith(fromPortablePath('/some/path/.clangd'));

            const fromDirectoryWithTrailingSlash = toConfigPath(fromPortablePath('some/path/'));
            expect(fromDirectoryWithTrailingSlash).to.endWith(fromPortablePath('/some/path/.clangd'));
        });

        // With a directory input, the result is resolved to an absolute path
        it('handles path that happens to have .clangd extension', function (): void {
            const fromTrickyPath = toConfigPath(fromPortablePath('some/path/project.clangd'));
            expect(fromTrickyPath).to.endWith(fromPortablePath('/some/path/project.clangd/.clangd'));
        });
    });

    describe('toPortablePath', function (): void {
        it('handles platform-specific path', function (): void {
            const pathSpec = 'this/is/a/path.c';
            const platformSpecificPath = fromPortablePath(pathSpec);
            expect(toPortablePath(platformSpecificPath)).to.equal(pathSpec);
        });
    });
});

function fromPortablePath(path: string): string {
    if (paths.sep !== '/') {
        return path.replace(/\/+/g, paths.sep);
    }
    return path;
}
