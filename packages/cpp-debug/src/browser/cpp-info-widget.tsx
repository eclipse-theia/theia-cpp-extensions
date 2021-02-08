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
/**
 * Agent content interface.
 */
interface AgentContents {
    id: string;
    'target-id': string;
    name: string;
    cores: string,
    threads: string;
    location_id: string;
}

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
     *
     */
    protected agentsList: Array<AgentContents>;
    /**
     * Number of the selected agent in the agent's list.
     */
    protected agentSelected: number = 0;
    /**
     * ID of the selected agent.
     */
    protected agentId: string;
    /**
     * Target ID of the selected agent.
     */
    protected agentTargetId: string;
    /**
     * Name of the selected agent.
     */
    protected agentName: string;
    /**
     * Cores of the selected agent.
     */
    protected agentCores: string;
    /**
     * Threads of the selected agent.
     */
    protected agentThreads: string;
    /**
     * Location ID of the selected agent.
     */
    protected agentLocationId: string;
    /**
     *
     */
    protected buttonGetAgents: React.ReactNode = <button className='theia-button' onClick={() => this.getAgents()} style={{ width: '100px' }}>GetAgents</button>;
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
        this.id = InfoView.ID;
        this.title.label = InfoView.LABEL;
        this.title.caption = InfoView.LABEL;
        this.title.closable = true;
        this.update();
    }

    /**
     * Find the HTML input field given the id.
     * @param id the id for the HTML element.
     */
    protected findField(id: string): HTMLInputElement | undefined {
        const field = document.getElementById(id);
        if (field === null) {
            return undefined;
        }

        return field as HTMLInputElement;
    }

    /**
     * Find the location field.
     */
    protected findLocationField(): HTMLInputElement | undefined {
        return this.findField(InfoView.ID);
    }

    /**
     * Set focus on the location field.
     */
    protected focusLocationField(): void {
        const input = this.findLocationField();
        if (input) {
            (input as HTMLInputElement).focus();
            (input as HTMLInputElement).select();
        }
    }

    /**
     * Handle the `activateRequest` message.
     * @param msg the activation request message.
     */
    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.focusLocationField();
    }

    /**
     * Get the agents informations.
     */
    protected async getAgents(): Promise<void> {
        if (this.debugSessionManager === undefined) {
            throw new Error('No active debug session.');
        }
        const session = this.debugSessionManager.currentSession;
        if (session === undefined) {
            throw new Error('No active debug session.');
        }
        try {
            const result = await session.sendCustomRequest('cdt-gdb-adapter/Agents', undefined);
            this.agentsList = result.body;
            this.agentId = this.agentsList[0].id;
            this.agentTargetId = this.agentsList[0]['target-id'];
            this.agentName = this.agentsList[0].name;
            this.agentCores = this.agentsList[0].cores;
            this.agentThreads = this.agentsList[0].threads;
            this.agentLocationId = this.agentsList[0].location_id;
            this.update();
        } catch (err) {
            console.error(err.message);
        }
    }

    /**
     * Render the widget.
     */
    protected render(): React.ReactNode {
        console.log('render');
        if (this.agentsList === undefined || this.agentsList.length === 0) {
            return this.renderErrorMessage(' No agents currently running.');
        }
        return <React.Fragment>
                <div className='t-mv-container'>
                {this.buttonGetAgents}
                 Id : {this.agentId}<br/>
                 Target id : {this.agentTargetId}<br/>
                 Name : {this.agentName}<br/>
                 Cores : {this.agentCores}<br/>
                 Threads : {this.agentThreads}<br/>
                 Location ID : {this.agentLocationId}<br/>
                </div>
            </React.Fragment>;
    }

    /**
     * Render the error message.
     * @param msg the error message.
     */
    protected renderErrorMessage(msg: string): React.ReactNode {
        console.log('renderErrorMessage');
        return <div className='t-iv-error'>
            <i className='fa fa-warning t-iv-error-icon'></i>
            {msg}<br/>
            {this.buttonGetAgents}
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
        this.update();
        return;
    }
}
