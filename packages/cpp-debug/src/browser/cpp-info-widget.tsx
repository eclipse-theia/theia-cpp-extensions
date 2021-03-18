/********************************************************************************
 * Copyright (C) Bohémond Couka.
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
import { Message, ReactWidget } from '@theia/core/lib/browser';
import { debounce } from 'lodash';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
// import { TreeElement } from '@theia/core/lib/browser/source-tree';
import { DebugThreadsWidget } from '@theia/debug/lib/browser/view/debug-threads-widget';
import { Widget, PanelLayout, ViewContainer, BaseWidget } from '@theia/core/lib/browser';
import { InfoTreeWidget, Node } from './tree/tree-view';
import { InfoWidget } from './info/info-widget';

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

/**
 * Queue content interface.
 */
interface QueueContents {
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
interface DispatcheContents {
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
interface ThreadContents {
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

/**
 * GPUThreadsList interface.
 */
export interface GPUThreadsList {
    /**
     * GPUThreadsList interface.
     */
    addThread(thread: ThreadContents): void;
}

@injectable()
export class InfoView extends BaseWidget implements GPUThreadsList {
    /**
     * The info view ID.
     */
    static readonly ID = 'info.view';
    /**
     * The info view label.
     */
    static readonly LABEL = 'GPU Debug Info';
    /**
     * The DebugSessionManager :)
     */
    @inject(DebugSessionManager)
    protected readonly debugSessionManager!: DebugSessionManager;

    /**
     * The DebugSessionManager :)
     */
    @inject("ThreadsTreeWidget")
    protected readonly threads: InfoTreeWidget;

    /**
     * The DebugSessionManager :)
     */
    @inject("QueuesTreeWidget")
    protected readonly queues: InfoTreeWidget;

    /**
     * The DebugSessionManager :)
     */
    @inject("AgentsTreeWidget")
    protected readonly agents: InfoTreeWidget;

    /**
     * The DebugSessionManager :)
     */
    @inject("DispatchesTreeWidget")
    protected readonly dispatches: InfoTreeWidget;
    
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
    protected viewContainer: ViewContainer;

    /**
     * The React node for display the command info.
     */
    @inject(ViewContainer.Factory)
    protected readonly viewContainerFactory: ViewContainer.Factory;

    /**
     * The React node for display the command info.
     */
    protected info: InfoWidget;

    /**
     * Initialize the widget.
     */
    @postConstruct()
    protected async init(): Promise<void> {
        this.id = InfoView.ID;
        this.title.label = InfoView.LABEL;
        this.title.caption = InfoView.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'debug-tab-icon';
        this.viewContainer = this.viewContainerFactory({
            id: 'debug:view-container:' + 'infoGPU'
        });
        this.info = new InfoWidget(this.debugSessionManager, this);
        this.threads.setTitle('Threads');
        this.queues.setTitle('Queues');
        this.agents.setTitle('Agents');
        this.dispatches.setTitle('Dispatches');
        this.viewContainer.addWidget(this.threads, { weight: 30 });
        this.viewContainer.addWidget(this.queues, { weight: 40 });
        this.viewContainer.addWidget(this.agents, { weight: 50 });
        this.viewContainer.addWidget(this.dispatches, { weight: 60 });
        this.viewContainer.addWidget(this.info, { weight: 70 });
        // this.viewContainer.addWidget(this, { weight: 30});
        this.toDispose.pushAll([
            this.viewContainer
        ]);

        const layout = this.layout = new PanelLayout();
        layout.addWidget(this.viewContainer);

        this.state = {value: '--empty'};
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
     * Set focus on the location field.
     */
    protected focusInfoField(): void {
        const input = this.findField('t-iv-select-command');
        if (input) {
            (input as HTMLInputElement).focus();
        }
    }

    /**
     * Handle the `activateRequest` message.
     * @param msg the activation request message.
     */
    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.focusInfoField();
    }

    /**
     * Handle the `activateRequest` message.
     * @param msg the activation request message.
     */
    public addThread(thread: ThreadContents): void {
        // this.threads.source = this.threadsGPU;
        const node = new Node(thread.id);
        node.addElement({name:'Id', value: thread.id});
        node.addElement({name:'Name',  value: thread.name});
        node.addElement({name:'Target-id',  value:thread['target-id']});
        node.addElement({name:'State',  value: thread.state});
        
        this.threads.addNode(node);
        console.log('Thread ajouté : ' + thread.id);
    }

    /**
     * Handle the `activateRequest` message.
     * @param msg the activation request message.
     */
    public addQueue(queue: QueueContents): void {
        const node = new Node(queue.id);
        node.addElement({name:'Id', value: queue.id});
        node.addElement({name:'Target-id',  value:queue['target-id']});
        node.addElement({name:'Type',  value: queue.type});
        node.addElement({name:'Size',  value: queue.size});
        node.addElement({name:'Address',  value: queue.addr});

        this.queues.addNode(node);
    }

    /**
     * Handle the `activateRequest` message.
     * @param msg the activation request message.
     */
    public addAgent(agent: AgentContents): void {
        const node = new Node(agent.id);
        node.addElement({name:'Id', value: agent.id});
        node.addElement({name:'Target-id',  value:agent['target-id']});
        node.addElement({name:'Name',  value: agent.name});
        node.addElement({name:'Cores',  value: agent.cores});
        node.addElement({name:'Threads',  value: agent.threads});
        node.addElement({name:'Location Id',  value: agent.location_id});

        this.agents.addNode(node);
    }

    /**
     * Handle the `activateRequest` message.
     * @param msg the activation request message.
     */
    public addDispatche(dispatche: DispatcheContents): void {
        const node = new Node(dispatche.id);
        node.addElement({name:'Id', value: dispatche.id});
        node.addElement({name:'Target-id',  value:dispatche['target-id']});
        node.addElement({name:'Grid',  value: dispatche.grid});
        node.addElement({name:'Workgroup',  value: dispatche.workgroup});
        node.addElement({name:'Fence',  value: dispatche.fence});
        node.addElement({name:'Address Spaces',  value: dispatche['address-spaces']});
        node.addElement({name:'Kernel Desc',  value: dispatche['kernel-desc']});
        node.addElement({name:'Kernel Args',  value: dispatche['kernel-args']});
        node.addElement({name:'Completion',  value: dispatche['completion']});
        node.addElement({name:'Kernel Function',  value: dispatche['kernel-function']});

        this.dispatches.addNode(node);
    }
}
