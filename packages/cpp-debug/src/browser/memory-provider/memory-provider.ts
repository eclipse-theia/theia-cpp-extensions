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

import { Interfaces } from '../utils/memory-widget-utils';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { injectable, inject } from '@theia/core/shared/inversify';
import { DebugProtocol } from 'vscode-debugprotocol';
import * as Array64 from 'base64-arraybuffer';
import Long = require('long');

export const MemoryProvider = Symbol('MemoryProvider');
/**
 * Representation of a memory provider.
 */
export interface MemoryProvider {
    /**
     * Read `number` bytes of memory at address `location`, which can be
     * any expression evaluating to an address.
     */
    readMemory(readMemoryArguments: DebugProtocol.ReadMemoryArguments): Promise<Interfaces.MemoryReadResult>;

    /**
     * @param location any expression evaluating to an address.
     * @param content the new value to write to that address, as a hex-encoded string.
     */
    writeMemory?(writeMemoryArguments: DebugProtocol.WriteMemoryArguments): Promise<DebugProtocol.WriteMemoryResponse>;
}

/**
 * Convert an hex-encoded string of bytes to the Uint8Array equivalent.
 */
export function base64ToBytes(base64: string): Interfaces.LabeledUint8Array {
    return new Uint8Array(Array64.decode(base64));
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

    async readMemory(readMemoryArguments: DebugProtocol.ReadMemoryArguments): Promise<Interfaces.MemoryReadResult> {
        const session = this.debugSessionManager.currentSession;
        if (session === undefined) {
            throw new Error('No active debug session.');
        }

        // @ts-ignore /* Theia 1.17.0 will include the readMemoryRequest in its types. Until then, we can send the request anyway */
        const result = await session.sendRequest('readMemory', readMemoryArguments) as DebugProtocol.ReadMemoryResponse;

        if (result.body?.data) {
            const { body: { data, address } } = result;
            const bytes = base64ToBytes(data);
            const longAddress = result.body.address.startsWith('0x') ? Long.fromString(address, true, 16) : Long.fromString(address, true, 10);
            return { bytes, address: longAddress };
        }
        throw new Error('Received no data from debug adapter.');
    }

    async writeMemory(writeMemoryArguments: DebugProtocol.WriteMemoryArguments): Promise<DebugProtocol.WriteMemoryResponse> {
        const { currentSession } = this.debugSessionManager;
        if (!currentSession) {
            throw new Error('No active debug session.');
        }

        // @ts-ignore /* Theia 1.17.0 will include the writeMemoryRequest in its types. Until then, we can send the request anyway */
        return currentSession.sendCustomRequest('writeMemory', writeMemoryArguments) as DebugProtocol.WriteMemoryResponse;
    }
}
