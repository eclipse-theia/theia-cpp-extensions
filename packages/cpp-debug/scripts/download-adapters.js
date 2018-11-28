/********************************************************************************
 * Copyright (C) 2018 Arm and others.
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

const request = require('request');
const path = require('path');
const mkdirp = require('mkdirp');
const tar = require('tar');
const unzip = require('unzip-stream');
const zlib = require('zlib');

const pck = require('../package.json');
const targetPath = pck['adapterDir'] || 'adapters';

for (const name in pck.adapters) {
    const url = pck.adapters[name];
    const adapterPath = path.join(targetPath, name);

    if (url.endsWith('gz')) {
        // Support tar gz
        mkdirp(adapterPath);
        const gunzip = zlib.createGunzip({
            finishFlush: zlib.Z_SYNC_FLUSH,
            flush: zlib.Z_SYNC_FLUSH
        });
        const untar = tar.x({
            cwd: adapterPath
        });
        request(url).pipe(gunzip).pipe(untar);   
    } else {
        // Support zip or vsix
        request(url).pipe(unzip.Extract({ path: adapterPath }));
    }
}
