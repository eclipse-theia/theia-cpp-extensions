import { SourceTreeWidget, TreeSource, TreeElement, TreeSourceNode } from '@theia/core/lib/browser/source-tree';
import * as React from 'react';
import { injectable, inject, postConstruct, interfaces, Container } from 'inversify';
import { MenuPath } from '@theia/core';
import { ExpressionContainer } from '@theia/debug/lib/browser/console/debug-console-items';

class Leef extends ExpressionContainer{
    constructor(protected name: string, protected value: string) {
        super({
            session: () => undefined,
            variablesReference: 0
        });
    }

    get visible(){
        return true;
    }
    
    render(): React.ReactNode{
        return (
        <div className='theia-debug-console-variable name'>
            <span className='name' title='char'>{this.name}: </span>
            <span title={this.value}>{this.value}</span>
        </div>
        );
    }
}

export class Node extends ExpressionContainer{
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

    render(): React.ReactNode {
        return this.id;
    }

    addElement(leef: {name: string, value: string}) {
        this.leefs.set(leef.name, new Leef(leef.name, leef.value))
    }

    async getElements(): Promise<IterableIterator<Leef>>{
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
        //this.fireDidChange();
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
    static CONTEXT_MENU: MenuPath = ['debug-threads-context-menu'];

    /**
     * None
     */
    static CONTROL_MENU = [...InfoTreeWidget.CONTEXT_MENU, 'a_control'];

    /**
     * None
     */
    static TERMINATE_MENU = [...InfoTreeWidget.CONTEXT_MENU, 'b_terminate'];

    /**
     * None
     */
    static OPEN_MENU = [...InfoTreeWidget.CONTEXT_MENU, 'c_open'];

    /**
     * None
     */
    static createContainer(parent: interfaces.Container): Container {
        const child = SourceTreeWidget.createContainer(parent, {
            contextMenuPath: InfoTreeWidget.CONTEXT_MENU,
            virtualized: false,
            scrollIfActive: true
        });
        child.unbind(SourceTreeWidget);
        child.bind(InfoTreeWidget).toSelf();
        return child;
    }
    
    static createWidget(parent: interfaces.Container, id: string): InfoTreeWidget {
        let widget = InfoTreeWidget.createContainer(parent).get(InfoTreeWidget);
        widget.setId(id);
        return widget
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

    setId(id: string): void {
        this.id = this.id = 'debug:gpu:threads:' + id;
    }

    setTitle(title: string): void{
        if(this.title.label) {
            console.log('ancient titre : ' + this.title.label)
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