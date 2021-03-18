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

/**
 * Leaf of the tree.
 * Render a view like 'name: value' into the widget. 
 * @extends ExressionContainer
 */
class Leaf extends ExpressionContainer {
    /**
     * Name of the leaf.
     */
    protected name: string;

    /**
     * Value of the leaf.
     */
    protected value: string
    /**
     * Create a leaf.
     * @param name The name of the leaf.
     * @param value The value of the leaf.
     */
    constructor(name: string, value: string) {
        super({
            session: () => undefined,
            variablesReference: 0
        });
        this.name = name;
        this.value = value;
    }

    /**
     * Is the leaf visible. 
     */
    get visible(): boolean {
        return true;
    }

    /**
     * 
     * @return The React view of the leaf.
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

/**
 * Node of the tree.
 * @extends ExressionContainer
 */
export class Node extends ExpressionContainer {
    /**
     * Collection of leafs.
     */
    public leafs: Set<Leaf>;

    /**
     * Create a need node.
     * @param id Id of the new node.
     */
    constructor(public readonly id: string) {
        super({
            session: () => undefined,
            variablesReference: 1
        });
        this.leafs = new Set<Leaf>();
    }

    /**
     * render the thread with React.
     */
    get visible(): boolean {
        return true;
    }

    /**
     * Render the node : just give his id to be display.
     */
    render(): React.ReactNode {
        return this.id;
    }

    /**
     * Add a new element (leaf)
     * @param leaf None
     */
    addElement(leaf: {name: string, value: string}): void {
        this.leafs.add(new Leaf(leaf.name, leaf.value));
    }

    /**
     * Get all the elements.
     * @return An iterator of the elements.
     */
    async getElements(): Promise<IterableIterator<Leaf>> {
        return this.leafs.values();
    }
}

/**
 * Tree.
 * @extends TreeSource
 */
export class Tree extends TreeSource {
    /**
     * Agent content interface.
     */
    protected nodes: Map<string, Node>;

    /**
     * Create a new tree.
     */
    constructor() {
        super({
            placeholder: 'Not running'
        });
        this.nodes = new Map<string, Node>();
    }

    /**
     * Add a node to the tree.
     * @param node The node to add to the tree.
     */
    addNode(node: Node): void {
        this.nodes.set(node.id, node);
        this.fireDidChange();
    }

    /**
     * Get all the elements.
     * @return An iterator of the elements.
     */
    getElements(): IterableIterator<Node> {
        return this.nodes.values();
    }

}

/**
 * InfoTreeWidget.
 * @extends SourceTreeWidget
 */
@injectable()
export class InfoTreeWidget extends SourceTreeWidget {

    /**
     * Function use by Inversify bind.toDynamicValue methode to create a new InfoTreeWidget.
     * @param parent Parent container.
     * @return A container with A new instance of InfoTreeWidget bind to itself.
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
     * Create a new InfoTreeWidgete with the Inversify bind.toDynamicValue methode.
     * @param parent The parent container for creating the widget.
     * @param id The id of the futur InfoTreeWidget instance.
     * @return A new instance of InfoTreeWidget.
     */
    static createWidget(parent: interfaces.Container, id: string): InfoTreeWidget {
        const widget = InfoTreeWidget.createContainer(parent).get(InfoTreeWidget);
        widget.setId(id);
        return widget;
    }

    /**
     * The tree wich contain the nodes to display.
     */
    protected tree: Tree;

    /**
     * Call after the creation by Inversify. Allow us to finish the initialisation
     * of the widget.
     */
    @postConstruct()
    protected init(): void {
        super.init();
        this.tree = new Tree();
        // this.toDispose.push(this.tree);
        this.source = this.tree;

    }

    /**
     * Set the id of the widget.
     * This should only be use in the process creation of the Widget.
     * @param id The new id of the Widget.
     */
    private setId(id: string): void {
        this.id = 'debug:gpu:threads:' + id;
    }

    /**
     * Set the title of the widget.
     * @param title The new title of the widget.
     */
    setTitle(title: string): void {
        this.title.label = title;
    }

    /**
     * Add a new node to the reprentating tree.
     * @param node The node to add to the tree.
     */
     public addNode(node: Node): void {
        this.tree.addNode(node);
    }
}
