/********************************************************************************
 * Copyright (C) 2021 Bohémond Couka, Ericsson and others.
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
import { ReactWidget } from '@theia/core/lib/browser';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { InfoView } from '../cpp-info-widget';

/**
 * Agent content interface.
 */
export interface AgentContents {
    id: string;
    'target-id': string;
    name: string;
    cores: string,
    threads: string;
    location_id: string;
}

/**
 * Queue content interface.
 */
export interface QueueContents {
    id: string;
    'target-id': string;
    type: string;
    read: string; // optional
    write: string; // optional
    size: string;
    addr: string;
}

/**
 * Dispatche content interface.
 */
export interface DispatcheContents {
    id: string;
    'target-id': string;
    grid: string;
    workgroup: string;
    fence: string;
    'address-spaces': string;
    'kernel-desc': string;
    'kernel-args': string;
    'completion': string;
    'kernel-function': string;
}

/**
 * Variable interface.
 */
interface Variable {
    name: string;
    value: string;
}

/**
 * Frame interface.
 */
interface Frame {
    addr: string;
    arch: string;
    args: Array<Variable>;
    file: string;
    fullname: string;
    func: string;
    level: string;
    line: string;
}

/**
 * Thread content interface.
 */
export interface ThreadContents {
    id: string;
    'target-id': string;
    name: string;
    frame: Frame;
    state: string;
    core: string; // optional
}

/**
 * Command option interface.
 */
interface CommandState {
    value: string;
}

export class InfoWidget extends ReactWidget {
    /**
     * List of agents.
     */
    protected agentsList: Array<AgentContents> | undefined;
    /**
     * List of queues.
     */
    protected queuesList: Array<QueueContents> | undefined;
    /**
     * The DebugSessionManager :)
     */
    protected debugSessionManager: DebugSessionManager;

    /**
     * The state for the select command.
     */
    protected state: CommandState;

    /**
     * The React node for display the command info.
     */
    protected divInfo: React.ReactNode;

    /**
     * The React node for display the command info.
     */
    protected infoView: InfoView;

    constructor(debugSessionManager: DebugSessionManager, infoView: InfoView) {
        super();
        this.debugSessionManager = debugSessionManager;
        this.state = {value: '--empty'};
        this.infoView = infoView;
    }

    /**
     * Get the info content.
     */
    protected async getInfoContents<T>(cmd: string): Promise<Array<T> | undefined> {
        if (this.debugSessionManager === undefined) {
            throw new Error('No active debug session.');
        }
        const session = this.debugSessionManager.currentSession;
        if (session === undefined) {
            throw new Error('No active debug session.');
        }
        try {
            const result = await session.sendCustomRequest(cmd, undefined);
            return result.body;
        } catch (err) {
            console.error(err.message);
            return undefined;
        }
    }

    /**
     * Change the command info.
     * @param event the event to be process.
     */
    protected changeCommand = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        console.log('changement de ' + this.state.value + ' vers ' + event.target.value);
        if (this.debugSessionManager === undefined || this.debugSessionManager.currentSession === undefined) {
            this.divInfo = this.renderErrorMessage(' No agents currently running.');
            console.log('debugSessionManager : ' + this.debugSessionManager);
            console.log('currentSession : ' + this.debugSessionManager?.currentSession);
            this.update();
        } else {
            this.state.value = event.target.value;
            this.updateCommand();
        }
    }

    /**
     * Update info.
     */
    protected async updateCommand(): Promise<void> {
        console.log('updateCommand : ' + this.state.value);
        switch (this.state.value) {
            case 'agents' : {
                await this.processAgents();
                break;
            }
            case 'queues' : {
                await this.processQueues();
                break;
            }
            case 'dispatches' : {
                await this.processDispatches();
                break;
            }
            case 'threads' : {
                await this.processThreads();
                break;
            }
        }
        this.update();
    }

    /**
     * Process the command info agents.
     */
    protected async processAgents(): Promise<void> {
        const list = await this.getInfoContents<AgentContents>('cdt-gdb-adapter/Agents');
        if (list) {
            for (const agent of list) {
                this.infoView.addAgent(agent);
            }
            this.divInfo = this.renderInfoArrayAgent(list);
        } else {
            this.divInfo = this.renderErrorMessage(' No agents currently running.');
        }
    }

    /**
     * Process the command info queues.
     */
    protected async processQueues(): Promise<void> {
        const list = await this.getInfoContents<QueueContents>('cdt-gdb-adapter/Queues');
        if (list) {
            for (const queue of list) {
                this.infoView.addQueue(queue);
            }
            this.divInfo = this.renderInfoArrayQueues(list);
        } else {
            this.divInfo = this.renderErrorMessage(' No agents currently running.');
        }
    }

    /**
     * Process the command info dispatches.
     */
    protected async processDispatches(): Promise<void> {
        const list = await this.getInfoContents<DispatcheContents>('cdt-gdb-adapter/Dispatches');
        if (list) {
            for (const dispatche of list) {
                this.infoView.addDispatche(dispatche);
            }
            this.divInfo = this.renderInfoArrayDispatches(list);
        } else {
            this.divInfo = this.renderErrorMessage(' No agents currently running.');
        }
    }

    /**
     * Process the command info threads.
     */
    protected async processThreads(): Promise<void> {
        const list = await this.getInfoContents<ThreadContents>('cdt-gdb-adapter/Threads');
        if (list) {
            for (const thread of list) {
                console.log('thread name : ' + thread.name);
                this.infoView.addThread(thread);
            }
            // this.threads.source = this.threadsGPU;
            this.divInfo = this.renderInfoArrayThreads(list);
        } else {
            this.divInfo = this.renderErrorMessage(' No agents currently running.');
        }
    }

    /**
     * Render the widget.
     */
    protected shouldComponentUpdate(): boolean {
        console.log('shouldComponentUpdate');
        return true;
    }

    /**
     * Render the widget.
     */
    protected render(): React.ReactNode {
        console.log('render !');
        return (
        <React.Fragment>
            <div id='t-iv-widget' className='t-iv-container' tabIndex={0} >
            <select value={this.state.value} onChange={this.changeCommand} className='theia-select' id='t-iv-select-command' tabIndex={0}>
                <option value='--empty' disabled> -- select an option -- </option>
                <option value='agents'>agents</option>
                <option value='queues'>queues</option>
                <option value='dispatches'>dispatches</option>
                <option value='threads'>threads</option>
             </select>
             {this.divInfo}
            </div>
        </React.Fragment>
        );
    }

    /**
     * Render the content of an info agent.
     * @param agent the agent.
     */
    protected renderInfoArrayAgent(agents: Array<AgentContents>): React.ReactNode {
        const tableAgents = <table className='theia-table'>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Target Id</th>
                    <th>Name</th>
                    <th>Cores</th>
                    <th>Threads</th>
                    <th>Location ID</th>
                </tr>
            </thead>
            <tbody>
            {agents.map(agent => this.renderInfoAgent(agent))}
            </tbody>
        </table>;
        return <div className='t-iv-agents-content'>
            {tableAgents}
        </div>;
    }

    /**
     * Render the content of an info agent.
     * @param agent the agent.
     */
    protected renderInfoAgent(agent: AgentContents): React.ReactNode {
        return <tr key={agent.id}>
            <td>{agent.id}</td>
            <td>{agent['target-id']}</td>
            <td>{agent.name}</td>
            <td>{agent.cores}</td>
            <td>{agent.threads}</td>
            <td>{agent.location_id}</td>
        </tr>;
    }

    /**
     * Render the content of a queue.
     * @param queue the queue to render.
     */
    protected renderInfoQueues(queue: QueueContents): React.ReactNode {
        return <tr key={queue.id}>
            <td>{queue.id}</td>
            <td>{queue['target-id']}</td>
            <td>{queue.type}</td>
            <td>{queue.read}</td>
            <td>{queue.write}</td>
            <td>{queue.size}</td>
            <td>{queue.addr}</td>
        </tr>;
    }

    /**
     * Render the content of queues.
     * @param queues the array queues to render.
     */
    protected renderInfoArrayQueues(queues: Array<QueueContents>): React.ReactNode {
        const tableQueues = <table className='theia-table'>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Target Id</th>
                    <th>Type</th>
                    <th>Read</th>
                    <th>Write</th>
                    <th>Size</th>
                    <th>addr</th>
                </tr>
            </thead>
            <tbody>
            {queues.map(queue => this.renderInfoQueues(queue))}
            </tbody>
        </table>;
        return <div className='t-iv-queues-content'>
            {tableQueues}
        </div>;
    }

    /**
     * Render the content of a dispatche.
     * @param dispatche the disptache to render.
     */
    protected renderInfoDispatche(dispatche: DispatcheContents): React.ReactNode {
        return <tr key={dispatche.id}>
            <td>{dispatche.id}</td>
            <td>{dispatche['target-id']}</td>
            <td>{dispatche.grid}</td>
            <td>{dispatche.workgroup}</td>
            <td>{dispatche.fence}</td>
            <td>{dispatche['address-spaces']}</td>
            <td>{dispatche['kernel-desc']}</td>
            <td>{dispatche['kernel-args']}</td>
            <td>{dispatche.completion}</td>
            <td>{dispatche['kernel-function']}</td>
        </tr>;
    }

    /**
     * Render the content of dispatches.
     * @param dispatches the array dispatches to render.
     */
    protected renderInfoArrayDispatches(dispatches: Array<DispatcheContents>): React.ReactNode {
        const tableDispatches = <table className='theia-table'>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Target Id</th>
                    <th>Grid</th>
                    <th>Workgroup</th>
                    <th>Fence</th>
                    <th>Address Spaces</th>
                    <th>Kernel Desc</th>
                    <th>Kernel Args</th>
                    <th>Completion</th>
                    <th>Kernel Function</th>
                </tr>
            </thead>
            <tbody>
            {dispatches.map(dispatche => this.renderInfoDispatche(dispatche))}
            </tbody>
        </table>;
        return <div className='t-iv-dispatches-content'>
            {tableDispatches}
        </div>;
    }

    /**
     * Render the content of a frame.
     * @param frame the frame to render.
     */
    protected renderFrame(frame: Frame): React.ReactNode {
        return <div className='t-iv-frame-content'>
            {frame.fullname}<br/>
        </div>;
    }

    /**
     * Render the content of a thread.
     * @param thread the thread to render.
     */
    protected renderInfoThread(thread: ThreadContents): React.ReactNode {
        return <tr key={thread.id}>
            <td>{thread.id}</td>
            <td>{thread['target-id']}</td>
            <td>{thread.name}</td>
            <td>{this.renderFrame(thread.frame)}</td>
            <td>{thread.state}</td>
            <td>{thread.core}</td>
        </tr>;
    }

    /**
     * Render the content of dispatches.
     * @param queues the array queues to render.
     */
    protected renderInfoArrayThreads(threads: Array<ThreadContents>): React.ReactNode {
        const tableThreads = <table className='theia-table'>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Target Id</th>
                    <th>name</th>
                    <th>frame</th>
                    <th>state</th>
                    <th>core</th>
                </tr>
            </thead>
            <tbody>
            {threads.map(thread => this.renderInfoThread(thread))}
            </tbody>
        </table>;
        return <div className='t-iv-threads-content'>
            {tableThreads}
        </div>;
    }

    /**
     * Render the error message.
     * @param msg the error message.
     */
    protected renderErrorMessage(msg: string): React.ReactNode {
        return <div className='t-iv-error'>
            <i className='fa fa-warning t-iv-error-icon'></i>
            {msg}<br/>
        </div>;
    }

    /**
     * Render the table view for the widget.
     */
    protected renderView(): React.ReactNode {
        return <div id='t-iv-view-container'>
        <i className='fa fa-warning t-mv-error-icon'></i>
        </div>;
    }

    /**
     * Perform widget refresh.
     */
    protected doRefresh = (event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
        if ('key' in event && event.key !== 'Enter') {
            return;
        }
        this.doUpdateInfoView();
    }

    /**
     * Actually update the info view.
     */
    protected doUpdateInfoView(): void {
        this.update();
        return;
    }
}
