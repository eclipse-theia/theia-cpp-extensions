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
import * as React from 'react';
import { debounce } from 'lodash';
import { MemoryProvider, VariableRange, MemoryReadResult } from './memory-provider';
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget, Message } from '@theia/core/lib/browser';
import { DebugSession } from '@theia/debug/lib/browser/debug-session';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { DebugVariable } from '@theia/debug/lib/browser/console/debug-console-items';
import { hexStrToUnsignedLong } from '../common/util';

/**
 * Return true if `byte` represents a printable ASCII character.
 */
function isBytePrintable(byte: number): boolean {
    return byte >= 32 && byte < 127;
}

/**
 * Type to represent big and little endianness.
 */
type Endianness = 'le' | 'be';
function isValidEndianness(val: string): val is Endianness {
    return val == 'le' || val == 'be';
}

interface IndexedItem<T> {
    // Index of the item in the item array.
    index: number;

    // Value of the item.
    item: T;
}

/**
 * Iterators to be able to iterate forward and backwards on byte arrays.
 */
class BigEndianByteIterator<T> implements Iterator<IndexedItem<T>> {
    private nextIndex: number = 0;

    constructor(private array: T[]) { }

    next(): IteratorResult<IndexedItem<T>> {
        if (this.nextIndex < this.array.length) {
            const thisIndex = this.nextIndex++;
            return {
                value: {
                    index: thisIndex,
                    item: this.array[thisIndex],
                },
                done: false,
            };
        } else {
            return {
                done: true,
                value: undefined as any,
            };
        }
    }

    [Symbol.iterator](): IterableIterator<IndexedItem<T>> {
        return this;
    }
}

class LittleEndianByteIterator<T> implements Iterator<IndexedItem<T>> {
    private nextIndex: number;

    constructor(private array: T[]) {
        this.nextIndex = this.array.length - 1;
    }

    next(): IteratorResult<IndexedItem<T>> {
        if (this.nextIndex >= 0) {
            const thisIndex = this.nextIndex--;
            return {
                value: {
                    index: thisIndex,
                    item: this.array[thisIndex],
                },
                done: false,
            };
        } else {
            return {
                done: true,
                value: undefined as any,
            };
        }
    }

    [Symbol.iterator](): IterableIterator<IndexedItem<T>> {
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
    static readonly LOCATION_OFFSET_FIELD_ID = 't-mv-location-offset';
    static readonly LENGTH_FIELD_ID = 't-mv-length';
    static readonly BYTES_PER_ROW_FIELD_ID = 't-mv-bytesrow';
    static readonly BYTES_PER_GROUP_FIELD_ID = 't-mv-bytesgroup';
    static readonly LITTLE_ENDIAN_BUTTON_ID = "t-mv-little-endian";
    static readonly BIG_ENDIAN_BUTTON_ID = "t-mv-big-endian";
    static readonly ENDIANNESS_BUTTONS_NAME = "t-mv-endianness";

    protected memoryReadResult: MemoryReadResult | undefined = undefined;
    protected memoryReadResultOffset: number = 0;
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

    protected get locationOffset(): number {
        const locationOffsetField = this.findLocationOffsetField();
        if (locationOffsetField) {
            const locationOffset = parseInt(locationOffsetField.value);
            if (isNaN(locationOffset)) {
                return this.locationOffset = 0;
            }
            return locationOffset;
        }
        return 0;
    }

    protected set locationOffset(value: number) {
        const locationOffsetField = this.findLocationOffsetField();
        if (locationOffsetField) {
            locationOffsetField.value = value.toString(10);
        } 
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

    protected findLocationOffsetField(): HTMLInputElement | undefined {
        return this.findField(MemoryView.LOCATION_OFFSET_FIELD_ID);
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
                        key={MemoryView.LOCATION_FIELD_ID}
                        className='t-mv-input'
                        type='text'
                        size={15}
                        title='Memory location to display, an address or expression evaluating to an address'
                        onChange={this.onLocationChange}
                        onKeyUp={this.doRefresh} />
                </span>
                <span className='t-mv-input-group'>
                    <label className='t-mv-label'>Offset</label>
                    <input
                        id={MemoryView.LOCATION_OFFSET_FIELD_ID}
                        key={MemoryView.LOCATION_OFFSET_FIELD_ID}
                        className='t-mv-input'
                        type='text'
                        size={15}
                        title='Offset to be added to the current memory location, when navigating'
                        defaultValue={this.locationOffset.toString()}
                        onChange={this.onLocationOffsetChange}
                        onKeyUp={this.doRefresh} />
                </span>
                <span className='t-mv-input-group'>
                    <label className='t-mv-label'>Length</label>
                    <input
                        id={MemoryView.LENGTH_FIELD_ID}
                        key={MemoryView.LENGTH_FIELD_ID}
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
                        key={MemoryView.BYTES_PER_ROW_FIELD_ID}
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
                        key={MemoryView.BYTES_PER_GROUP_FIELD_ID}
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
                            key={MemoryView.LITTLE_ENDIAN_BUTTON_ID}
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
                            key={MemoryView.BIG_ENDIAN_BUTTON_ID}
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
        return <div id='t-mv-view-container' onWheel={this.onWheelMemoryView} onKeyDown={this.onKeyboardMemoryView} tabIndex={0}>
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

    /**
     * Yields offsetted bytes from the given array `bytes`.
     */
    protected *offsettedBytes(bytes: Uint8Array, offset: number): Iterable<number | undefined> {
        for (let i = 0; i < bytes.length; i++) {
            if (i < -offset || i > bytes.length + -offset) {
                yield undefined;
            } else {
                yield bytes[i + offset];
            }
        }
    }

    protected renderViewRows(result: MemoryReadResult, variables: VariableRange[]): React.ReactNode {
        const locationOffset = this.locationOffset;
        const locationOffsetDelta = locationOffset - this.memoryReadResultOffset;

        const iterator = this.offsettedBytes(result.bytes, locationOffsetDelta)[Symbol.iterator]();

        interface RenderRow {
            location: Long
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

            const rowBytes: Array<number | undefined> = [];
            for (let i = 0; i < this.bytesPerRow; i++) {
                rowBytes.push(iterator.next().value);
            }

            const rowAddress: Long = result.address.add(rowOffset).add(locationOffsetDelta);
            const addressStr: string = '0x' + rowAddress.toString(16);
            let rowNodes: React.ReactNode[] = [];
            let asciiStr = '';

            // For each byte group in the row...
            for (let groupOffset = 0; groupOffset < rowBytes.length; groupOffset += this.bytesPerGroup) {

                // Bytes shown in this group.
                const groupAddress = rowAddress.add(groupOffset);
                const groupBytes = rowBytes.slice(groupOffset, groupOffset + this.bytesPerGroup);

                const iteratorType: { new(...args: any[]): Iterable<IndexedItem<number | undefined>> } =
                    this.endianness == 'be' ? BigEndianByteIterator : LittleEndianByteIterator;

                // For each byte in the group
                for (const indexedByte of new iteratorType(groupBytes)) {

                    if (!indexedByte || !indexedByte.item) {
                        rowNodes.push(<span>xx</span>);
                        continue;
                    }
                    let byteStr: string = indexedByte.item!.toString(16);
                    if (byteStr.length == 0) {
                        byteStr = 'xx'
                    }
                    else if (byteStr.length == 1) {
                        byteStr = '0' + byteStr;
                    }

                    const byteAddress = groupAddress.add(indexedByte.index);
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
                    asciiStr += typeof byte === 'undefined' ?
                        ' ' : isBytePrintable(byte) ? String.fromCharCode(byte) : '.';
                }
            }

            rows.push({
                location: rowAddress,
                address: addressStr,
                nodes: rowNodes,
                ascii: asciiStr,
            })
        }

        return rows.map((row, index) =>
            <tr className={'t-mv-view-row' + (
                // Add a marker to help visual navigation when scrolling
                row.location.modulo(this.bytesPerRow * 8).lessThan(this.bytesPerRow) ?
                    ' t-mv-view-row-highlight' : '')
            } key={index}>
                <td className='t-mv-view-address'>{row.address}</td>
                <td className='t-mv-view-data'>{row.nodes}</td>
                <td className='t-mv-view-code'>{row.ascii}</td>
            </tr>);
    }

    protected onWheelMemoryView = (event: React.WheelEvent) => {
        if (this.memoryReadResult) {
            const { scrollTop } = event.currentTarget;
            const containerHeight = event.currentTarget.getBoundingClientRect().height;
            const contentHeight = event.currentTarget.firstElementChild!.getBoundingClientRect().height;
            const scrollMax = Math.max(0, contentHeight - containerHeight);
            const canScrollDown = scrollTop >= scrollMax;
            const canScrollUp = scrollTop <= 0;

            const { deltaY } = event;
            const step = this.bytesPerRow * 2;

            if (canScrollUp && deltaY < 0) { // wheel up: go up
                this.locationOffset -= step;
            } else if (canScrollDown && deltaY > 0) { // wheel down: go down
                this.locationOffset += step;
            } else {
                return;
            }
            this.update();
            this.updateMemoryView();
        }
    };

    protected onKeyboardMemoryView = (event: React.KeyboardEvent) => {
        if (this.memoryReadResult) {
            const { scrollTop } = event.currentTarget;
            const containerHeight = event.currentTarget.getBoundingClientRect().height;
            const contentHeight = event.currentTarget.firstElementChild!.getBoundingClientRect().height;
            const scrollMax = Math.max(0, contentHeight - containerHeight);
            const canScrollDown = scrollTop >= scrollMax;
            const canScrollUp = scrollTop <= 0;

            const step = this.bytesPerRow * 2; // skip a few lines at most
            const bigStep = 256; // move past the whole result page

            if (canScrollUp && event.key === 'ArrowUp') {
                this.locationOffset -= step;
            } else if (canScrollDown && event.key === 'ArrowDown') {
                this.locationOffset += step;

            } else if (canScrollUp && event.key === 'PageUp') {
                this.locationOffset -= bigStep;
            } else if (canScrollDown && event.key === 'PageDown') {
                this.locationOffset += bigStep;

            } else {
                return;
            }
            this.update();
            this.updateMemoryView();
        }
    }

    protected doRefresh = (event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
        if ('key' in event && event.key !== 'Enter') {
            return;
        }
        this.updateMemoryView();
    }

    protected updateMemoryView = debounce(this.doUpdateMemoryView.bind(this), 200);
    protected async doUpdateMemoryView() {
        try {
            // Remove results from previous run.
            this.memoryReadResult = undefined;

            const locationField = this.findLocationField();
            const locationOffsetField = this.findLocationOffsetField();
            const lengthField = this.findLengthField();
            if (
                locationField === undefined ||
                locationOffsetField === undefined ||
                lengthField === undefined
            ) {
                return;
            }

            if (locationField.value.length == 0) {
                throw new Error('Enter an address or expression in the Location field.');
            }

            if (lengthField.value.length == 0) {
                throw new Error('Enter a length (decimal or hexadecimal number) in the Length field.');
            }

            const locationOffset = this.locationOffset;
            this.memoryReadResult = await this.memoryProvider.readMemory(locationField.value, parseInt(lengthField.value), locationOffset);
            this.memoryReadResultOffset = locationOffset;
            this.variables = await getLocals(this.debugSessionManager.currentSession);

        } catch (err) {
            console.error('Failed to read memory', err);
            this.memoryReadError = err.message;

            this.memoryReadResult = undefined;
            this.variables = undefined;
        }

        this.update();
    }

    protected onLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const locationOffsetField = this.findLocationOffsetField();
        if (locationOffsetField) {
            locationOffsetField.value = '0';
            this.locationOffset = 0;
        }
    }

    protected onLocationOffsetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (!/^\d*$/.test(value)) {
            return;
        }

        this.locationOffset = value.length > 0 ? parseInt(value, 10) : 0;
    }

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
