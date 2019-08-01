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
import { MemoryProvider, MemoryReadResult } from './memory-provider';
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget, Message } from '@theia/core/lib/browser';
import { debounce } from 'lodash';

/**
 * Return true if `byte` represents a printable ASCII character.
 */
function isPrintable(byte: number): boolean {
    return byte >= 32 && byte < 127;
}

/**
 * Type to represent big and little endianness.
 */
type Endianness = 'le' | 'be';
function isValidEndianness(val: string): val is Endianness {
    return val === 'le' || val === 'be';
}

/**
 * Iterators to be able to iterate forward and backwards on byte arrays.
 */
// tslint:disable-next-line:no-any
class ForwardIterator<T = any> implements Iterator<T> {
    private nextItem: number = 0;

    constructor(private array: T[]) { }

    next(): IteratorResult<T> {
        if (this.nextItem < this.array.length) {
            return {
                value: this.array[this.nextItem++],
                done: false,
            };
        } else {
            return {
                done: true,
                // tslint:disable-next-line:no-any
                value: undefined as any,
            };
        }
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this;
    }
}

// tslint:disable-next-line:no-any
class ReverseIterator<T = any> implements Iterator<T> {
    private nextItem = this.array.length - 1;

    constructor(private array: T[]) { }

    next(): IteratorResult<T> {
        if (this.nextItem >= 0) {
            return {
                value: this.array[this.nextItem--],
                done: false,
            };
        } else {
            return {
                done: true,
                // tslint:disable-next-line:no-any
                value: undefined as any,
            };
        }
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this;
    }
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
    static readonly LITTLE_ENDIAN_BUTTON_ID = 't-mv-little-endian';
    static readonly BIG_ENDIAN_BUTTON_ID = 't-mv-big-endian';
    static readonly ENDIANNESS_BUTTONS_NAME = 't-mv-endianness';

    protected memoryReadResult: MemoryReadResult | undefined = undefined;
    protected memoryReadResultOffset: number = 0;
    // If bytes is undefined, this string explains why.
    protected memoryReadError: string = 'No memory contents currently available.';

    // Parameters for the rendering of the memory contents.
    protected bytesPerRow: number = 16;
    protected bytesPerGroup: number = 1;
    protected endianness: Endianness = 'le';

    @inject(MemoryProvider)
    protected readonly memoryProvider!: MemoryProvider;

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
        const locationOffssetField = this.findLocationOffsetField();
        if (locationOffssetField) {
            const locationOffset = parseInt(locationOffssetField.value);
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
                            type='radio'
                            value='le'
                            name={MemoryView.ENDIANNESS_BUTTONS_NAME}
                            defaultChecked={this.endianness === 'le'}
                            onChange={this.onEndiannessChange} />
                        Little Endian
                    </label>
                    <label className='t-mv-radio-label'>
                        <input
                            id={MemoryView.BIG_ENDIAN_BUTTON_ID}
                            type='radio'
                            value='be'
                            name={MemoryView.ENDIANNESS_BUTTONS_NAME}
                            onChange={this.onEndiannessChange}
                            defaultChecked={this.endianness === 'be'} />
                        Big Endian
                    </label>
                </span>
            </div>
        </div>;
    }

    protected renderErrorMessage(msg: string): React.ReactNode {
        return <div className='t-mv-error'>
            <i className='fa fa-warning t-mv-error-icon'></i>
            {msg}
        </div>;
    }

    protected renderView(): React.ReactNode {
        if (this.memoryReadResult === undefined) {
            return this.renderErrorMessage(this.memoryReadError);
        }

        const rows = this.renderViewRows(this.memoryReadResult);
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
        </div>;
    }

    protected *offsetedBytes(bytes: Uint8Array, offset: number): Iterable<number | undefined> {
        for (let i = 0; i < bytes.length; i++) {
            if (i < -offset || i > bytes.length + -offset) {
                yield undefined;
            } else {
                yield bytes[i + offset];
            }
        }
    }

    protected renderViewRows(result: MemoryReadResult): React.ReactNode {
        const locationOffset = this.locationOffset;
        const locationOffsetDelta = locationOffset - this.memoryReadResultOffset;
        const address = result.address;
        const rows: [number, ...string[]][] = [];

        const iterator = this.offsetedBytes(result.bytes, locationOffsetDelta)[Symbol.iterator]();

        // For each row...
        for (let rowOffset = 0; rowOffset < result.bytes.length; rowOffset += this.bytesPerRow) {
            // Bytes shown in this row.

            const rowBytes: Array<number | undefined> = [];
            for (let i = 0; i < this.bytesPerRow; i++) {
                rowBytes.push(iterator.next().value);
            }

            const rowAddr = address + rowOffset + locationOffsetDelta;
            const addressStr = '0x' + rowAddr.toString(16);
            let rowBytesStr = '';
            let asciiStr = '';

            // For each byte group in the row...
            for (let groupOffset = 0; groupOffset < rowBytes.length; groupOffset += this.bytesPerGroup) {

                // Bytes shown in this group.
                const groupBytes = rowBytes.slice(groupOffset, groupOffset + this.bytesPerGroup);

                let groupStr = '';

                // tslint:disable-next-line:no-any
                const iteratorType: { new(...args: any[]): Iterable<number | undefined> } =
                    this.endianness === 'be' ? ForwardIterator : ReverseIterator;

                // For each byte in the group
                for (const byte of new iteratorType(groupBytes)) {

                    if (typeof byte === 'undefined') {
                        groupStr += 'xx';
                        continue;
                    }

                    const byteStr = byte.toString(16);
                    if (byteStr.length === 1) {
                        groupStr += '0';
                    }

                    groupStr += byteStr;
                }

                rowBytesStr += groupStr + ' ';

                // The ASCII view is always in strictly increasing address order.
                for (const byte of groupBytes) {
                    asciiStr += typeof byte === 'undefined' ?
                        ' ' : isPrintable(byte) ? String.fromCharCode(byte) : '.';
                }
            }

            rows.push([rowAddr, addressStr, rowBytesStr, asciiStr]);
        }

        return rows.map((row, index) =>
            <tr className={'t-mv-view-row' + (
                // Add a marker to help visual navigation when scrolling
                row[0] % (this.bytesPerRow * 8) < this.bytesPerRow ?
                    ' t-mv-view-row-highlight' : '')
            } key={index}>
                <td className='t-mv-view-address'>{row[1]}</td>
                <td className='t-mv-view-data'>{row[2]}</td>
                <td className='t-mv-view-code'>{row[3]}</td>
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
    }

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
    protected doUpdateMemoryView(): void {

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

        if (locationField.value.length === 0) {
            this.memoryReadError = 'Enter an address or expression in the Location field.';
            this.update();
            return;
        }

        if (lengthField.value.length === 0) {
            this.memoryReadError = 'Enter a length (decimal or hexadecimal number) in the Length field.';
            this.update();
            return;
        }

        const locationOffset = this.locationOffset;
        this.memoryProvider.readMemory(locationField.value, parseInt(lengthField.value), locationOffset)
            .then(result => {
                this.memoryReadResult = result;
                this.memoryReadResultOffset = locationOffset;
                this.update();
            }).catch(err => {
                console.error('Failed to read memory', err);
                this.memoryReadError = err.message;
                this.memoryReadResult = undefined;
                this.update();
            });
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
