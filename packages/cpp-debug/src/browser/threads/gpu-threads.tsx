import { SourceTreeWidget, TreeSource, TreeElement, TreeSourceNode } from '@theia/core/lib/browser/source-tree';
import * as React from 'react';
import { injectable, inject, postConstruct, interfaces, Container } from 'inversify';
import { MenuPath } from '@theia/core';
import { ExpressionContainer } from '@theia/debug/lib/browser/console/debug-console-items';


class GPUThreadElement extends ExpressionContainer{
    constructor(protected nom: string, protected valeur: string) {
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
            <span className='name' title='char'>{this.nom}: </span>
            <span title={this.valeur}>{this.valeur}</span>
        </div>
        );
    }
}

export class GPUThread extends ExpressionContainer{
    /**
     * Id of the thread.
     */
    public id: string;
    /**
     * Id of the target.
     */
    public 'target-id': string;
    /**
     * Status the thread.
     */
    public currentStatus: string;
    /**
     * Name the thread.
     */
    public name: string;
    /**
     * None
     */
    public gpuElements: Map<string, GPUThreadElement>;

    constructor(thread: {id: string, name: string, 'target-id': string, state: string}) {
        super({
            session: () => undefined,
            variablesReference: 1
        });
        console.log('GPUThread : ' + thread.id);
        this.id = thread.id;
        this['target-id'] = thread['target-id'];
        this.currentStatus = thread.state;
        this.name = thread.name;
        console.log('name : ' + thread.name)
        this.gpuElements = new Map<string, GPUThreadElement>();
        this.gpuElements.set('name', new GPUThreadElement('name', this.name));
        this.gpuElements.set('id', new GPUThreadElement('id', this.id));
        this.gpuElements.set('target-id', new GPUThreadElement('target-id', this['target-id']));
        this.gpuElements.set('currentStatus', new GPUThreadElement('currentStatus', this.currentStatus));
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

    async getElements(): Promise<IterableIterator<GPUThreadElement>>{
        return this.gpuElements.values();
    }
}

export class DebugGPUThreads extends TreeSource {
    /**
     * Agent content interface.
     */
    protected threads: Map<string, GPUThread>;

    constructor() {
        super({
            placeholder: 'Not running'
        });
        //this.fireDidChange();
        this.threads = new Map<string, GPUThread>();
    }

    /**
     * Add a threads to the tree.
     */
    addThread(thread: GPUThread): void {
        console.log('addThread:DebugGPUThreads');
        if(this.threads.has(thread.id)) {
            console.log('Thread already exist.');
        } else {
            console.log('Thread doesn\'t exist.');
        }
        this.threads.set(thread.id, thread);
        this.fireDidChange();
    }

    /**
    * get all the elements.
    */
    getElements(): IterableIterator<GPUThread> {
        console.log('getElements');
        return this.threads.values();
    }

}

@injectable()
export class DebugGPUThreadsWidget extends SourceTreeWidget {

    /**
     * None
     */
    static CONTEXT_MENU: MenuPath = ['debug-threads-context-menu'];

    /**
     * None
     */
    static CONTROL_MENU = [...DebugGPUThreadsWidget.CONTEXT_MENU, 'a_control'];

    /**
     * None
     */
    static TERMINATE_MENU = [...DebugGPUThreadsWidget.CONTEXT_MENU, 'b_terminate'];

    /**
     * None
     */
    static OPEN_MENU = [...DebugGPUThreadsWidget.CONTEXT_MENU, 'c_open'];

    /**
     * None
     */
    static createContainer(parent: interfaces.Container): Container {
        const child = SourceTreeWidget.createContainer(parent, {
            contextMenuPath: DebugGPUThreadsWidget.CONTEXT_MENU,
            virtualized: false,
            scrollIfActive: true
        });
        // child.bind(DebugThreadsSource).toSelf();
        child.unbind(SourceTreeWidget);
        child.bind(DebugGPUThreadsWidget).toSelf();
        return child;
    }
    
    static createWidget(parent: interfaces.Container): DebugGPUThreadsWidget {
        return DebugGPUThreadsWidget.createContainer(parent).get(DebugGPUThreadsWidget);
    }

    /**
     * None
     */
    protected threads: DebugGPUThreads;

    /**
     * None
     */
    @postConstruct()
    protected init(): void {
        super.init();
        this.id = 'debug:gpu:threads:' + 'pouet';
        this.title.label = 'Threads';
        this.threads = new DebugGPUThreads();
        // this.toDispose.push(this.threads);
        this.source = this.threads;

        // this.toDispose.push(this.viewModel.onDidChange(() => this.updateWidgetSelection()));
        this.toDispose.push(this.model.onSelectionChanged(() => this.updateModelSelection()));
    }

    /**
     * None
     */
     public addThread(thread: GPUThread): void {
        this.threads.addThread(thread);
        this.model.root = TreeSourceNode.to(this.threads);
        // this.update();
    }

    protected updateModelSelection(): void {
        console.log('prout');
    }

     /*
    protected getDefaultNodeStyle(node: TreeNode, props: NodeProps): React.CSSProperties | undefined {
        if (this.threads.multiSession) {
            return super.getDefaultNodeStyle(node, props);
        }
        return undefined;
    }*/
}