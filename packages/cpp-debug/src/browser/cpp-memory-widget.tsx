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

import * as React from 'react';
import { MemoryProvider, VariableRange, MemoryReadResult } from './memory-provider';
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget, Message } from '@theia/core/lib/browser';
import * as Long from 'long';
import { DebugSession } from '@theia/debug/lib/browser/debug-session';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { DebugVariable } from '@theia/debug/lib/browser/console/debug-console-items';
import { hexStrToUnsignedLong } from '../common/util';

/**
 * Return true if `byte` represents a printable ASCII character.
 */
function isprint(byte: number) {
    return byte >= 32 && byte < 127;
}

/**
 * Type to represent big and little endianness.
 */
type Endianness = 'le' | 'be';
function isValidEndianness(val: string): val is Endianness {
    return val == 'le' || val == 'be';
}

interface IndexAndByte {
    // Index of the byte in the byte array.
    idx: number;

    // Value of the byte, [0-255].
    byte: number;
}

/**
 * Iterators to be able to iterate forward and backwards on byte arrays.
 */
class BigEndianByteIterator implements Iterator<IndexAndByte> {
    private nextIndex: number = 0;

    constructor(private array: Uint8Array) { }

    next(): IteratorResult<IndexAndByte> {
        if (this.nextIndex < this.array.length) {
            const thisIndex = this.nextIndex++;
            return {
                value: {
                    idx: thisIndex,
                    byte: this.array[thisIndex],
                },
                done: false,
            }
        } else {
            return {
                done: true,
                value: {
                    idx: -1,
                    byte: 0,
                },
            };
        }
    }

    [Symbol.iterator](): IterableIterator<IndexAndByte> {
        return this;
    }
}

class LittleEndianByteIterator implements Iterator<IndexAndByte> {
    private nextIndex: number;

    constructor(private array: Uint8Array) {
        this.nextIndex = this.array.length - 1;
    }

    next(): IteratorResult<IndexAndByte> {
        if (this.nextIndex >= 0) {
            const thisIndex = this.nextIndex--;
            return {
                value: {
                    idx: thisIndex,
                    byte: this.array[thisIndex],
                },
                done: false,
            }
        } else {
            return {
                done: true,
                value: {
                    idx: -1,
                    byte: 0,
                },
            };
        }
    }

    [Symbol.iterator](): IterableIterator<IndexAndByte> {
        return this;
    }
}

/**
 * Check if the address `byteAddress` is located within the range of one of
 * the variables of `variables`.  Return the index of the variable which
 * matches.
 */
function isInVariable(byteAddress: Long, variables: VariableRange[]): number {
    for (let i = 0; i < variables.length; i++) {
        const variable = variables[i];
        if (byteAddress.ge(variable.address) && byteAddress.lt(variable.pastTheEndAddress)) {
            return i;
        }
    }

    return -1;
}

@injectable()
export class MemoryView extends ReactWidget {

    static readonly ID = 'memory.view';
    static readonly LABEL = 'Memory';

    static readonly LOCATION_FIELD_ID = 't-mv-location';
    static readonly LENGTH_FIELD_ID = 't-mv-length';
    static readonly BYTES_PER_ROW_FIELD_ID = 't-mv-bytesrow';
    static readonly BYTES_PER_GROUP_FIELD_ID = 't-mv-bytesgroup';
    static readonly LITTLE_ENDIAN_BUTTON_ID = "t-mv-little-endian";
    static readonly BIG_ENDIAN_BUTTON_ID = "t-mv-big-endian";
    static readonly ENDIANNESS_BUTTONS_NAME = "t-mv-endianness";

    protected memoryReadResult: MemoryReadResult | undefined = undefined;
    // If bytes is undefined, this string explains why.
    protected memoryReadError: string = 'No memory contents currently available.';

    // Details about the current local variables.
    protected variables: VariableRange[] | undefined = undefined;

    // Parameters for the rendering of the memory contents.
    protected bytesPerRow: number = 16;
    protected bytesPerGroup: number = 1;
    protected endianness: Endianness = 'le';

    @inject(MemoryProvider)
    protected readonly memoryProvider!: MemoryProvider;

    @inject(DebugSessionManager)
    protected readonly debugSessionManager!: DebugSessionManager;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = MemoryView.ID;
        this.title.label = MemoryView.LABEL;
        this.title.caption = MemoryView.LABEL;
        this.title.closable = true;
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.focusLocationField();
    }

    protected findField(id: string): HTMLInputElement | undefined {
        const field = document.getElementById(id);
        if (field === null) {
            return undefined;
        }

        return field as HTMLInputElement;
    }

    protected findLocationField(): HTMLInputElement | undefined {
        return this.findField(MemoryView.LOCATION_FIELD_ID);
    }

    protected findLengthField(): HTMLInputElement | undefined {
        return this.findField(MemoryView.LENGTH_FIELD_ID);
    }

    protected focusLocationField(): void {
        const input = this.findLocationField();
        if (input) {
            (input as HTMLInputElement).focus();
            (input as HTMLInputElement).select();
        }
    }

    protected render(): React.ReactNode {
        return <div className='t-mv-container'>
            {this.renderInputContainer()}
            <hr id='t-mv-input-container-seperator' />
            {this.renderView()}
        </div>;
    }

    protected renderInputContainer(): React.ReactNode {
        return <div id='t-mv-wrapper'>
            <div className='t-mv-group'>
                <span className='t-mv-input-group'>
                    <label className='t-mv-label'>Location</label>
                    <input
                        id={MemoryView.LOCATION_FIELD_ID}
                        className='t-mv-input'
                        type='text'
                        size={15}
                        title='Memory location to display, an address or expression evaluating to an address'
                        onKeyUp={this.doRefresh} />
                </span>
                <span className='t-mv-input-group'>
                    <label className='t-mv-label'>Length</label>
                    <input
                        id={MemoryView.LENGTH_FIELD_ID}
                        className='t-mv-input'
                        type='text'
                        size={6}
                        title='Number of bytes to fetch, in decimal or hexadecimal'
                        onKeyUp={this.doRefresh}
                        defaultValue='256' />
                </span>
                <span className='t-mv-input-group'>
                    <button onClick={this.doRefresh}>Go</button>
                </span>
                <span style={{ width: '30px' }}></span>
                <span className='t-mv-input-group'>
                    <label className='t-mv-label'>Bytes Per Row</label>
                    <input
                        id={MemoryView.BYTES_PER_ROW_FIELD_ID}
                        className='t-mv-input'
                        type='text'
                        size={5}
                        defaultValue={this.bytesPerRow.toString()}
                        onChange={this.onBytesPerRowChange} />
                </span>
                <span className='t-mv-input-group'>
                    <label className='t-mv-label'>Bytes Per Group</label>
                    <select
                        id={MemoryView.BYTES_PER_GROUP_FIELD_ID}
                        className='t-mv-input'
                        defaultValue={this.bytesPerGroup.toString()}
                        onChange={this.onBytesPerGroupChange}>
                        <option value='1'>1</option>
                        <option value='2'>2</option>
                        <option value='4'>4</option>
                        <option value='8'>8</option>
                        <option value='16'>16</option>
                    </select>
                </span>
                <span className='t-mv-input-group'>
                    <label className='t-mv-radio-label'>
                        <input
                            id={MemoryView.LITTLE_ENDIAN_BUTTON_ID}
                            type="radio"
                            value="le"
                            name={MemoryView.ENDIANNESS_BUTTONS_NAME}
                            defaultChecked={this.endianness === 'le'}
                            onChange={this.onEndiannessChange} />
                        Little Endian
                    </label>
                    <label className='t-mv-radio-label'>
                        <input
                            id={MemoryView.BIG_ENDIAN_BUTTON_ID}
                            type="radio"
                            value='be'
                            name={MemoryView.ENDIANNESS_BUTTONS_NAME}
                            onChange={this.onEndiannessChange}
                            defaultChecked={this.endianness === 'be'} />
                        Big Endian
                    </label>
                </span>
            </div>
        </div>
    }

    protected renderErrorMessage(msg: string): React.ReactNode {
        return <div className='t-mv-error'>
            <i className='fa fa-warning t-mv-error-icon'></i>
            {msg}
        </div>
    }

    protected renderView(): React.ReactNode {
        if (this.memoryReadResult === undefined) {
            return this.renderErrorMessage(this.memoryReadError);
        }

        const rows = this.renderViewRows(this.memoryReadResult, this.variables || []);
        return <div id='t-mv-view-container'>
            <table id='t-mv-view'>
                <thead>
                    <tr>
                        <th>
                            <span className='t-mv-header-label'>Address</span>
                        </th>
                        <th>
                            <span className='t-mv-header-label'>Data</span>
                        </th>
                        <th>
                            <span className='t-mv-header-label'>ASCII</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        </div>
    }

    protected renderViewRows(result: MemoryReadResult, variables: VariableRange[]): React.ReactNode {
        interface RenderRow {
            address: string;
            nodes: React.ReactNode;
            ascii: string;
        }
        const rows: RenderRow[] = [];
        const pastTheEndAddress = result.address.add(result.bytes.length);

        // Filter down to variables that are in the scope of what we're showing in the
        // memory view.
        const variablesInRange = variables.filter(variable => {
            const isBefore = variable.pastTheEndAddress.le(result.address);
            const isAfter = variable.address.ge(pastTheEndAddress);
            return !(isBefore || isAfter);
        }).sort((first, second) => first.address.compare(second.address));

        // For each row...
        for (let rowOffset = 0; rowOffset < result.bytes.length; rowOffset += this.bytesPerRow) {
            // Bytes shown in this row.
            const rowBytes = result.bytes.subarray(rowOffset, rowOffset + this.bytesPerRow);

            const rowAddress = result.address.add(rowOffset);
            const addressStr = '0x' + rowAddress.toString(16);
            let rowNodes: React.ReactNode[] = [];
            let asciiStr = '';

            // For each byte group in the row...
            for (let groupOffset = 0; groupOffset < rowBytes.length; groupOffset += this.bytesPerGroup) {
                // Bytes shown in this group.
                const groupAddress = rowAddress.add(groupOffset);
                const groupBytes = rowBytes.subarray(groupOffset, groupOffset + this.bytesPerGroup);
                const iteratorType = this.endianness == 'be' ? BigEndianByteIterator : LittleEndianByteIterator;

                // For each byte in the group
                for (const item of new iteratorType(groupBytes)) {
                    let byteStr = item.byte.toString(16);
                    if (byteStr.length == 1) {
                        byteStr = '0' + byteStr;
                    }

                    const byteAddress = groupAddress.add(item.idx);
                    const inVariableIdx = isInVariable(byteAddress, variablesInRange);

                    // If this byte is part of a local variable, highlight it.
                    if (inVariableIdx >= 0) {
                        const hue = 360 * (inVariableIdx / variablesInRange.length);
                        const props: React.CSSProperties = {
                            color: `hsl(${hue}, 60%, 60%)`,
                        };
                        rowNodes.push(<span style={props} title={variablesInRange[inVariableIdx].name}>{byteStr}</span>);
                    } else {
                        rowNodes.push(<span>{byteStr}</span>);
                    }
                }

                rowNodes.push(<span>&nbsp;</span>);

                // The ASCII view is always in strictly increasing address order.
                for (const byte of groupBytes) {
                    asciiStr += isprint(byte) ? String.fromCharCode(byte) : '.';
                }
            }

            rows.push({
                address: addressStr,
                nodes: rowNodes,
                ascii: asciiStr,
            });
        }

        return <React.Fragment>
            {
                rows.map((row, index) =>
                    <tr className='t-mv-view-row' key={index}>
                        <td className='t-mv-view-address'>{row.address}</td>
                        <td className='t-mv-view-data'>{row.nodes}</td>
                        <td className='t-mv-view-code'>{row.ascii}</td>
                    </tr>
                )
            }
        </React.Fragment>;
    }

    protected doRefresh = async (event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
        try {
            if ('key' in event && event.key !== 'Enter') {
                return;
            }

            // Remove results from previous run.
            this.memoryReadResult = undefined;

            const locationField = this.findLocationField();
            const lengthField = this.findLengthField();
            if (locationField === undefined || lengthField === undefined) {
                return;
            }

            if (locationField.value.length == 0) {
                throw new Error('Enter an address or expression in the Location field.');
            }

            if (lengthField.value.length == 0) {
                throw new Error('Enter a length (decimal or hexadecimal number) in the Length field.');
            }

            this.memoryReadResult = await this.memoryProvider.readMemory(locationField.value, parseInt(lengthField.value));
            this.variables = await getLocals(this.debugSessionManager.currentSession);
            this.update();
        } catch (err) {
            console.error('Failed to read memory', err);
            this.memoryReadError = err.message;

            this.memoryReadResult = undefined;
            this.variables = undefined;
            this.update();
        }
    };

    // Callbacks for when the various view parameters change.
    protected onBytesPerRowChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (!/^[0-9]*$/.test(value)) {
            return;
        }

        this.bytesPerRow = value.length > 0 ? parseInt(value, 10) : 1;
        this.update();
    }

    protected onBytesPerGroupChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.bytesPerGroup = parseInt(event.target.value, 10);
        this.update();
    }

    protected onEndiannessChange = (event: React.FormEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        if (isValidEndianness(value)) {
            this.endianness = value;
        }
        this.update();
    }
}

/**
 * Get the local variables of the currently selected frame.
 */
async function getLocals(session: DebugSession | undefined): Promise<VariableRange[]> {
    if (session === undefined) {
        console.warn('No active debug session.');
        return [];
    }

    const frame = session.currentFrame;
    if (frame === undefined) {
        throw new Error('No active stack frame.');
    }

    const ranges: VariableRange[] = [];

    const scopes = await frame.getScopes();
    for (const scope of scopes) {
        const variables = await scope.getElements();
        for (const v of variables) {
            if (v instanceof DebugVariable) {
                const addrExp = `&${v.name}`;
                const sizeExp = `sizeof(${v.name})`;
                const addrResp = await session.sendRequest('evaluate', {
                    expression: addrExp,
                    context: 'watch',
                    frameId: frame.raw.id,
                });
                const sizeResp = await session.sendRequest('evaluate', {
                    expression: sizeExp,
                    context: 'watch',
                    frameId: frame.raw.id,
                });

                // Make sure the address is in the format we expect.
                if (!/^0x[0-9a-fA-F]+$/.test(addrResp.body.result)) {
                    continue;
                }

                if (!/^[0-9]+$/.test(sizeResp.body.result)) {
                    continue;
                }

                const size = parseInt(sizeResp.body.result);
                const address = hexStrToUnsignedLong(addrResp.body.result);
                const pastTheEndAddress = address.add(size);

                ranges.push({
                    name: v.name,
                    address: address,
                    pastTheEndAddress: pastTheEndAddress,
                });
            }
        }
    }

    return ranges;
}
