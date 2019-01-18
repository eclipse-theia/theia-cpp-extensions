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
import { MemoryProvider } from './memory-provider';
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget, Message } from '@theia/core/lib/browser';

/**
 * Return true if `byte` represents a printable ASCII character.
 */
function isprint(byte: number) {
    return byte >= 32 && byte < 127;
}

@injectable()
export class MemoryView extends ReactWidget {

    static readonly ID = 'memory.view';
    static readonly LABEL = 'Memory';
    static readonly BYTES_PER_ROW = 16;

    protected startAddress: number = 0;
    protected bytes: Uint8Array | undefined = undefined;
    // If bytes is undefined, this string explains why.
    protected memoryReadError: string = 'No memory address information currently available.';

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
        this.focusSearchField();
    }

    protected findSearchField(): HTMLInputElement | undefined {
        return document.getElementById('t-mv-search') as HTMLInputElement;
    }

    protected focusSearchField(): void {
        const input = this.findSearchField();
        if (input) {
            (input as HTMLInputElement).focus();
            (input as HTMLInputElement).select();
        }
    }

    protected render(): React.ReactNode {
        return <div className='t-mv-container'>
            {this.renderHeader()}
            {this.renderInputContainer()}
            <hr id='t-mv-input-container-seperator' />
            {this.renderView()}
        </div>;
    }

    protected renderHeader(): React.ReactNode {
        return <div className='t-mv-header'>
            <h1>Memory View</h1>
            <div id='refresh-action' title='Refresh'>
                <i className='fa fa-refresh' />
            </div>
        </div>;
    }

    protected renderInputContainer(): React.ReactNode {
        return <div id='t-mv-wrapper'>
            <div className='t-mv-group'>
                <span className='t-mv-input-group'>
                    <label className='t-mv-label'>Memory Address</label>
                    <input className='t-mv-input' id='t-mv-search' placeholder='Memory Address' type='text' onKeyUp={this.doRefresh} />
                </span>
                <span className='t-mv-input-group'>
                    <label className='t-mv-label'>Bytes Per Row</label>
                    <select className='t-mv-input' id='t-mv-bytesrow' defaultValue='1'>
                        <option value='0'>8</option>
                        <option value='1'>16</option>
                    </select>
                </span>
                <span className='t-mv-input-group'>
                    <label className='t-mv-label'>Bytes Per Group</label>
                    <select className='t-mv-input' id='t-mv-bytesgroup' defaultValue='0'>
                        <option value='0'>8</option>
                        <option value='1'>16</option>
                    </select>
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
        if (this.bytes === undefined) {
            return this.renderErrorMessage(this.memoryReadError);
        }

        const rows = this.renderViewRows(this.bytes);
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

    protected renderViewRows(bytes: Uint8Array): React.ReactNode {
        const rows: string[][] = [];

        // For each row...
        for (let offset = 0; offset < bytes.length; offset += MemoryView.BYTES_PER_ROW) {
            // Bytes shown in this row.
            const rowBytes = bytes.subarray(offset, offset + MemoryView.BYTES_PER_ROW);

            const addressStr = '0x' + (this.startAddress + offset).toString(16);
            let rowBytesStr = '';
            let asciiStr = '';

            // For each byte in the row...
            for (const byte of rowBytes) {
                const byteStr = byte.toString(16);
                if (byteStr.length == 1) {
                    rowBytesStr += '0';
                }

                rowBytesStr += byteStr + ' ';
                asciiStr += isprint(byte) ? String.fromCharCode(byte) : '.';
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

    protected doRefresh = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') {
            return;
        }

        const field = this.findSearchField();
        if (field === undefined) {
            return;
        }

        this.startAddress = parseInt(field.value, 16);
        this.memoryProvider.readMemory(this.startAddress, 128)
            .then(bytes => {
                this.bytes = bytes;
                this.update();
            }).catch(err => {
                console.error('Failed to read memory', err);
                this.memoryReadError = err.message;
                this.bytes = undefined;
                this.update();
            });

    };

}
