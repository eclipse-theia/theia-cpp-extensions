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

import { injectable, inject } from 'inversify';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import * as Long from 'long';
import { hexStrToUnsignedLong } from '../common/util';

/**
 * Representation of a memory read result.
 */
export interface MemoryReadResult {
    /**
     * The bytes for the read result.
     */
    bytes: Uint8Array,
    /**
     * The address for the read result.
     */
    address: Long,
}

export const MemoryProvider = Symbol('MemoryProvider');
/**
 * Representation of a memory provider.
 */
export interface MemoryProvider {
    /**
     * Read `number` bytes of memory at address `location`, which can be
     * any expression evaluating to an address.
     */
    readMemory(location: string, length: number, offset?: number): Promise<MemoryReadResult>;
}

/**
 * Convert an hex-encoded string of bytes to the Uint8Array equivalent.
 */
function hex2bytes(hex: string): Uint8Array {
    const arr: Uint8Array = new Uint8Array(hex.length / 2);

    for (let i = 0; i < hex.length / 2; i++) {
        const hexByte = hex.slice(i * 2, i * 2 + 2);
        const byte = parseInt(hexByte, 16);
        arr[i] = byte;
    }

    return arr;
}

/**
 * Read memory through the current debug session, using the cdt-gdb-adapter
 * extension to read memory.
 */
@injectable()
export class MemoryProviderImpl implements MemoryProvider {

    /**
     * Injected debug session manager.
     */
    @inject(DebugSessionManager)
    protected readonly debugSessionManager!: DebugSessionManager;

    /**
     * Read the memory for the given parameters.
     * @param location the location.
     * @param length the length.
     * @param offset the offset.
     */
    async readMemory(location: string, length: number, offset: number = 0): Promise<MemoryReadResult> {
        const session = this.debugSessionManager.currentSession;
        if (session === undefined) {
            throw new Error('No active debug session.');
        }

        const result = await session.sendCustomRequest('cdt-gdb-adapter/Memory', {
            address: location,
            length: length,
            offset,
        });

        const bytes = hex2bytes(result.body.data);
        const address = hexStrToUnsignedLong(result.body.address);

        return { bytes, address };
    }
}
