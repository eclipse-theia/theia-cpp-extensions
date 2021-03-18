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
import { SourceTreeWidget, TreeSource, TreeElement, TreeSourceNode } from '@theia/core/lib/browser/source-tree';
import * as React from 'react';
import { injectable, inject, postConstruct, interfaces, Container } from 'inversify';
import { MenuPath } from '@theia/core';
import { ExpressionContainer } from '@theia/debug/lib/browser/console/debug-console-items';

class Leef extends ExpressionContainer {
    constructor(protected name: string, protected value: string) {
        super({
            session: () => undefined,
            variablesReference: 0
        });
    }

    /**
     * None
     */
    get visible(): boolean {
        return true;
    }

    /**
     * None
     */
    render(): React.ReactNode {
        return (
        <div className='theia-debug-console-variable name'>
            <span className='name' title='char'>{this.name}: </span>
            <span title={this.value}>{this.value}</span>
        </div>
        );
    }
}

export class Node extends ExpressionContainer {
    /**
     * None
     */
    public leefs: Map<string, Leef>;

    constructor(public readonly id: string) {
        super({
            session: () => undefined,
            variablesReference: 1
        });
        this.leefs = new Map<string, Leef>();
    }

    /**
     * render the thread with React.
     */
    get visible(): boolean {
        return true;
    }

    /**
     * None
     */
    render(): React.ReactNode {
        return this.id;
    }

    /**
     * None
     * @param leef None
     */
    addElement(leef: {name: string, value: string}): void {
        this.leefs.set(leef.name, new Leef(leef.name, leef.value));
    }

    /**
     * None
     */
    async getElements(): Promise<IterableIterator<Leef>> {
        return this.leefs.values();
    }
}

export class Tree extends TreeSource {
    /**
     * Agent content interface.
     */
    protected nodes: Map<string, Node>;

    constructor() {
        super({
            placeholder: 'Not running'
        });
        this.nodes = new Map<string, Node>();
    }

    /**
     * Add a threads to the tree.
     */
    addNode(node: Node): void {
        this.nodes.set(node.id, node);
        this.fireDidChange();
    }

    /**
     * get all the elements.
     */
    getElements(): IterableIterator<Node> {
        return this.nodes.values();
    }

}

@injectable()
export class InfoTreeWidget extends SourceTreeWidget {

    /**
     * None
     */
    static createContainer(parent: interfaces.Container): Container {
        const child = SourceTreeWidget.createContainer(parent, {
            contextMenuPath: [],
            virtualized: false,
            scrollIfActive: true
        });
        child.unbind(SourceTreeWidget);
        child.bind(InfoTreeWidget).toSelf();
        return child;
    }

    /**
     * None
     */
    static createWidget(parent: interfaces.Container, id: string): InfoTreeWidget {
        const widget = InfoTreeWidget.createContainer(parent).get(InfoTreeWidget);
        widget.setId(id);
        return widget;
    }

    /**
     * None
     */
    protected tree: Tree;

    /**
     * None
     */
    @postConstruct()
    protected init(): void {
        super.init();
        this.tree = new Tree();
        // this.toDispose.push(this.tree);
        this.source = this.tree;

    }

    /**
     * None
     */
    setId(id: string): void {
        this.id = this.id = 'debug:gpu:threads:' + id;
    }

    /**
     * None
     */
    setTitle(title: string): void {
        if (this.title.label) {
            console.log('ancient titre : ' + this.title.label);
        }
        this.title.label = title;
    }

    /**
     * None
     */
     public addNode(node: Node): void {
        this.tree.addNode(node);
    }
}
