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

/**
 * Iterators to be able to iterate forward and backwards on byte arrays.
 */
class ForwardIterator implements Iterator<number> {
    private nextItem: number = 0;

    constructor(private array: Uint8Array) { }

    next(): IteratorResult<number> {
        if (this.nextItem < this.array.length) {
            return {
                value: this.array[this.nextItem++],
                done: false,
            }
        } else {
            return {
                done: true,
                value: 0,
            };
        }
    }

    [Symbol.iterator](): IterableIterator<number> {
        return this;
    }
}

class ReverseIterator implements Iterator<number> {
    private nextItem: number;

    constructor(private array: Uint8Array) {
        this.nextItem = this.array.length - 1;
    }

    next(): IteratorResult<number> {
        if (this.nextItem >= 0) {
            return {
                value: this.array[this.nextItem--],
                done: false,
            }
        } else {
            return {
                done: true,
                value: 0,
            };
        }
    }

    [Symbol.iterator](): IterableIterator<number> {
        return this;
    }
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

        const rows = this.renderViewRows(this.memoryReadResult);
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

    protected renderViewRows(result: MemoryReadResult): React.ReactNode {
        const rows: string[][] = [];

        // For each row...
        for (let rowOffset = 0; rowOffset < result.bytes.length; rowOffset += this.bytesPerRow) {
            // Bytes shown in this row.
            const rowBytes = result.bytes.subarray(rowOffset, rowOffset + this.bytesPerRow);

            const addressStr = '0x' + (result.address.add(rowOffset)).toString(16);
            let rowBytesStr = '';
            let asciiStr = '';

            // For each byte group in the row...
            for (let groupOffset = 0; groupOffset < rowBytes.length; groupOffset += this.bytesPerGroup) {
                // Bytes shown in this group.
                const groupBytes = rowBytes.subarray(groupOffset, groupOffset + this.bytesPerGroup);

                let groupStr = '';

                const iteratorType = this.endianness == 'be' ? ForwardIterator : ReverseIterator;

                // For each byte in the group
                for (const byte of new iteratorType(groupBytes)) {
                    const byteStr = byte.toString(16);
                    if (byteStr.length == 1) {
                        groupStr += '0';
                    }

                    groupStr += byteStr;
                }

                rowBytesStr += groupStr + ' ';

                // The ASCII view is always in strictly increasing address order.
                for (const byte of groupBytes) {
                    asciiStr += isprint(byte) ? String.fromCharCode(byte) : '.';
                }
            }

            rows.push([addressStr, rowBytesStr, asciiStr])
        }

        return <React.Fragment>
            {
                rows.map((row, index) =>
                    <tr className='t-mv-view-row' key={index}>
                        <td className='t-mv-view-address'>{row[0]}</td>
                        <td className='t-mv-view-data'>{row[1]}</td>
                        <td className='t-mv-view-code'>{row[2]}</td>
                    </tr>
                )
            }
        </React.Fragment>;
    }

    protected doRefresh = (event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
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
            this.memoryReadError = 'Enter an address or expression in the Location field.';
            this.update();
            return
        }

        if (lengthField.value.length == 0) {
            this.memoryReadError = 'Enter a length (decimal or hexadecimal number) in the Length field.';
            this.update();
            return
        }

        this.memoryProvider.readMemory(locationField.value, parseInt(lengthField.value))
            .then(result => {
                this.memoryReadResult = result;
                this.update();
            }).catch(err => {
                console.error('Failed to read memory', err);
                this.memoryReadError = err.message;
                this.memoryReadResult = undefined;
                this.update();
            });
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
