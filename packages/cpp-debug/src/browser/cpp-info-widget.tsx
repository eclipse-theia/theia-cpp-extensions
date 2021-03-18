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
import { injectable, postConstruct, inject } from 'inversify';
import { Message, ReactWidget } from '@theia/core/lib/browser';
import { debounce } from 'lodash';
import { DebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { DebugThreadsWidget } from '@theia/debug/lib/browser/view/debug-threads-widget';
import { Widget, PanelLayout, ViewContainer, BaseWidget } from '@theia/core/lib/browser';
import { InfoTreeWidget, Node } from './tree/tree-view';
import { InfoWidget, AgentContents, QueueContents, DispatcheContents, ThreadContents } from './info/info-widget';

@injectable()
export class InfoView extends BaseWidget {
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
    @inject('ThreadsTreeWidget')
    protected readonly threads: InfoTreeWidget;

    /**
     * The DebugSessionManager :)
     */
    @inject('QueuesTreeWidget')
    protected readonly queues: InfoTreeWidget;

    /**
     * The DebugSessionManager :)
     */
    @inject('AgentsTreeWidget')
    protected readonly agents: InfoTreeWidget;

    /**
     * The DebugSessionManager :)
     */
    @inject('DispatchesTreeWidget')
    protected readonly dispatches: InfoTreeWidget;

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

        this.viewContainer.addWidget(this.agents, { weight: 30 });
        this.viewContainer.addWidget(this.queues, { weight: 40 });
        this.viewContainer.addWidget(this.dispatches, { weight: 50 });
        this.viewContainer.addWidget(this.threads, { weight: 60 });
        this.viewContainer.addWidget(this.info, { weight: 70 });

        this.toDispose.pushAll([
            this.viewContainer
        ]);

        const layout = this.layout = new PanelLayout();
        layout.addWidget(this.viewContainer);

    }

    /**
     * Handle the `activateRequest` message.
     * @param msg the activation request message.
     */
    public addThread(thread: ThreadContents): void {
        // this.threads.source = this.threadsGPU;
        const node = new Node(thread.id);
        node.addElement({ name: 'Id', value: thread.id });
        node.addElement({ name: 'Name',  value: thread.name });
        node.addElement({ name: 'Target-id',  value: thread['target-id'] });
        node.addElement({ name: 'State',  value: thread.state });

        this.threads.addNode(node);
    }

    /**
     * Handle the `activateRequest` message.
     * @param msg the activation request message.
     */
    public addQueue(queue: QueueContents): void {
        const node = new Node(queue.id);
        node.addElement({ name: 'Id', value: queue.id });
        node.addElement({ name: 'Target-id',  value: queue['target-id'] });
        node.addElement({ name: 'Type',  value: queue.type });
        node.addElement({ name: 'Size',  value: queue.size });
        node.addElement({ name: 'Address',  value: queue.addr });

        this.queues.addNode(node);
    }

    /**
     * Add a hsa agent to the view.
     * @param agent the agent to be add.
     */
    public addAgent(agent: AgentContents): void {
        const node = new Node(agent.id);
        node.addElement({ name: 'Id', value: agent.id });
        node.addElement({ name: 'Target-id', value: agent['target-id'] });
        node.addElement({ name: 'Name',  value: agent.name });
        node.addElement({ name: 'Cores',  value: agent.cores });
        node.addElement({ name: 'Threads',  value: agent.threads });
        node.addElement({ name: 'Location Id',  value: agent.location_id });

        this.agents.addNode(node);
    }

    /**
     * Handle the `activateRequest` message.
     * @param dispatche the activation request message.
     */
    public addDispatche(dispatche: DispatcheContents): void {
        const node = new Node(dispatche.id);
        node.addElement({ name: 'Id', value: dispatche.id });
        node.addElement({ name: 'Target-id', value: dispatche['target-id'] });
        node.addElement({ name: 'Grid',  value: dispatche.grid });
        node.addElement({ name: 'Workgroup', value: dispatche.workgroup });
        node.addElement({ name: 'Fence',  value: dispatche.fence });
        node.addElement({ name: 'Address Spaces', value: dispatche['address-spaces'] });
        node.addElement({ name: 'Kernel Desc', value: dispatche['kernel-desc'] });
        node.addElement({ name: 'Kernel Args', value: dispatche['kernel-args'] });
        node.addElement({ name: 'Completion', value: dispatche['completion'] });
        node.addElement({ name: 'Kernel Function', value: dispatche['kernel-function'] });

        this.dispatches.addNode(node);
    }
}
