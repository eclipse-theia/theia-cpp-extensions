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

import * as fs from 'fs';
import * as paths from 'path';
import * as rimraf from 'rimraf';
import * as mkdirp from 'mkdirp';
import * as os from 'os';

/* eslint-disable no-unused-expressions */

let tmpDir: string;

type ContentInitializer = string | ((resolvedPath: string) => string);

export const tmpFile = (path: string, content?: ContentInitializer) => {
    const result = paths.resolve(tmpDir, path);
    if (content !== undefined) {
        mkdirp.sync(paths.dirname(result));

        const initialContent = typeof content === 'string' ? content : content(result);
        fs.writeFileSync(result, initialContent, 'utf8');
    }
    return result;
};

export const createTmpDir = () => {
    if (!tmpDir) {
        tmpDir = fs.mkdtempSync(paths.join(os.tmpdir(), 'mocha'));
        const cleanUp = (exit: boolean) => () => {
            rimraf.sync(tmpDir);
            exit && process.exit();
        };
        process.on('exit', cleanUp(false));
        process.on('SIGINT', cleanUp(true));
        process.on('uncaughtException', cleanUp(true));
    }
};
