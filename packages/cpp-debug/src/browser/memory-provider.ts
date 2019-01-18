import { injectable, inject } from "inversify";
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';

export const MemoryProvider = Symbol('MemoryProvider');
export interface MemoryProvider {
    readMemory(address: number, length: number): Promise<Uint8Array>;
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
    @inject(DebugSessionManager)
    protected readonly debugSessionManager!: DebugSessionManager;

    async readMemory(address: number, length: number): Promise<Uint8Array> {
        const session = this.debugSessionManager.currentSession;
        if (session === undefined) {
            throw new Error('No active debug session.');
        }

        const result = await session.sendCustomRequest('cdt-gdb-adapter/Memory', {
            address,
            length,
        });

        return hex2bytes(result.body.data);
    }
}
