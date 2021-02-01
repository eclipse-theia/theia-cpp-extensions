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
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget, Message } from '@theia/core/lib/browser';
import { debounce } from 'lodash';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';

@injectable()
export class InfoView extends ReactWidget {
    /**
     * The info view ID.
     */
    static readonly ID = 'info.view';
    /**
     * The info view label.
     */
    static readonly LABEL = 'Info';
    /**
     * Texte pour des tests.
     */
    protected texte: string = 'Rien';
    /**
     * The DebugSessionManager :)
     */
    @inject(DebugSessionManager)
    protected readonly debugSessionManager!: DebugSessionManager;

    /**
     * Initialize the widget.
     */
    @postConstruct()
    protected async init(): Promise<void> {
        console.log('init');
        this.id = InfoView.ID;
        this.title.label = InfoView.LABEL;
        this.title.caption = InfoView.LABEL;
        this.title.closable = true;
        this.update();
    }

    /**
     * Handle the `activateRequest` message.
     * @param msg the activation request message.
     */
    protected onActivateRequest(msg: Message): void {
        console.log('onActivateRequest');
        super.onActivateRequest(msg);
    }

    /**
     * Find the HTML input field given the id.
     * @param id the id for the HTML element.
     */
    protected findField(id: string): HTMLInputElement | undefined {
        console.log('findField');
        const field = document.getElementById(id);
        if (field === null) {
            return undefined;
        }

        return field as HTMLInputElement;
    }

    /**
     * Get the agents informations.
     */
    protected async getAgents(): Promise<void> {
        console.log('getAgents');
        console.log('On se fout de moi ?\n');
        const session = this.debugSessionManager.currentSession;
        console.log(session);
        console.log('\n');
        if (session === undefined) {
            throw new Error('No active debug session.');
        }
        try {
            const result = await session.sendCustomRequest('cdt-gdb-adapter/Agents', {
            address: 'pouet',
            length: 2,
            offset: 0,
        });
            console.log('Patapouet ?');
            console.log(result.body);
            this.texte = result.body.data;
            this.update();
        } catch (err) {
            console.error(err.message);
        }
    }

    /**
     * Render the widget.
     */
    protected render(): React.ReactNode {
        console.log('renderP');
        this.getAgents();
        return <React.Fragment>
                <div className='t-mv-container'>
                 {this.texte}
                </div>
            </React.Fragment>;
    }

    /**
     * Render the input container for the widget.
     */
    protected renderInputContainer(): React.ReactNode {
        console.log('renderInputContainer');
        return <div id='t-iv-wrapper'>
        <i className='fa fa-warning t-mv-error-icon'></i>
        </div>;
    }

    /**
     * Render the error message.
     * @param msg the error message.
     */
    protected renderErrorMessage(msg: string): React.ReactNode {
        console.log('renderErrorMessage');
        return <div className='t-iv-error'>
            <i className='fa fa-warning t-iv-error-icon'></i>
            {msg}
        </div>;
    }

    /**
     * Render the table view for the widget.
     */
    protected renderView(): React.ReactNode {
        console.log('renderView');
        return <div id='t-iv-view-container'>
        <i className='fa fa-warning t-mv-error-icon'></i>
        </div>;
    }

    /**
     * Perform widget refresh.
     */
    protected doRefresh = (event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
        console.log('doRefresh');
        if ('key' in event && event.key !== 'Enter') {
            return;
        }
        this.updateInfoView();
    }

    /**
     * Update the info view.
     */
    protected updateInfoView = debounce(this.doUpdateInfoView.bind(this), 200);
    /**
     * Actually update the info view.
     */
    protected doUpdateInfoView(): void {
        console.log('doUpdateInfoView');
        this.update();
        return;
    }
}
