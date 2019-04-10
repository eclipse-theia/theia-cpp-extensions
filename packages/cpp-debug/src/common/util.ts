/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
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

import * as Long from 'long';

/**
 * Parse `hexStr` as an hexadecimal string (with or without the leading 0x)
 * and return the value as a Long.
 */
export function hexStrToUnsignedLong(hexStr: string): Long {
    if (hexStr[0] === '0' && hexStr[1] === 'x') {
        hexStr = hexStr.slice(2);
    }

    const lowStr = hexStr.slice(-8);
    const highStr = hexStr.slice(0, hexStr.length - 8);
    const low = parseInt(lowStr, 16);
    const high = parseInt(highStr, 16);

    return new Long(low, high, true);
}
