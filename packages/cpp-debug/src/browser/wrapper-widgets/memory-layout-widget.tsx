/********************************************************************************
 * Copyright (C) 2021 Ericsson and others.
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

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ApplicationShell, Message, Panel, Widget, WidgetManager } from '@theia/core/lib/browser';
import { Disposable, DisposableCollection, Emitter } from '@theia/core';
import { MemoryWidgetManager } from '../utils/memory-widget-manager';
import { MemoryWidget } from '../memory-widget/memory-widget';
import { MemoryDiffSelectWidget } from '../diff-widget/memory-diff-select-widget';
import { MemoryDockPanel } from './memory-dock-panel';
import { MemoryDockpanelPlaceholder } from './memory-dockpanel-placeholder-widget';

@injectable()
export class MemoryLayoutWidget extends Panel implements Disposable, ApplicationShell.TrackableWidgetProvider {
    static readonly ID = 'memory-layout-widget';
    static readonly LABEL = 'Memory Inspector';

    // Necessary to inherit theia's tabbar styling
    static readonly DOCK_PANEL_ID = 'theia-main-content-panel';
    static readonly THEIA_TABBAR_CLASSES = ['theia-app-centers', 'theia-app-main'];
    static readonly CPP_TABBAR_CLASS = 'memory-dock-tabbar';
    static readonly DOCK_PANEL_CLASS = 'memory-dock-panel';

    @inject(WidgetManager) protected readonly widgetManager: WidgetManager;
    @inject(MemoryWidgetManager) protected readonly memoryWidgetManager: MemoryWidgetManager;
    @inject(MemoryDiffSelectWidget) protected readonly diffSelectWidget: MemoryDiffSelectWidget;
    @inject(MemoryDockpanelPlaceholder) protected readonly placeholderWidget: MemoryDockpanelPlaceholder;
    @inject(ApplicationShell) protected readonly shell: ApplicationShell;

    protected readonly onDidChangeTrackableWidgetsEmitter = new Emitter<Widget[]>();
    readonly onDidChangeTrackableWidgets = this.onDidChangeTrackableWidgetsEmitter.event;

    protected readonly toDispose = new DisposableCollection();
    protected dockPanel: MemoryDockPanel;
    protected hasGeneratedWidgetAutomatically = false;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = MemoryLayoutWidget.ID;
        this.addClass(MemoryLayoutWidget.ID);
        this.title.label = MemoryLayoutWidget.LABEL;
        this.title.caption = MemoryLayoutWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'memory-view-icon';
        this.dockPanel = await this.widgetManager.getOrCreateWidget<MemoryDockPanel>(MemoryDockPanel.ID);
        this.addWidget(this.dockPanel);
        this.addWidget(this.diffSelectWidget);
        this.addWidget(this.placeholderWidget);
        this.toDispose.push(this.memoryWidgetManager.onDidCreateNewWidget(widget => {
            this.dockPanel.addWidget(widget);
            this.dockPanel.activateWidget(widget);
            this.onDidChangeTrackableWidgetsEmitter.fire([widget]);
        }));
        this.toDispose.push(this.memoryWidgetManager.onChanged(() => {
            if (!this.memoryWidgetManager.canCompare) {
                this.diffSelectWidget.hide();
            }
        }));
        this.dockPanel.widgetRemoved.connect(this.handleWidgetRemoved.bind(this), this);
        this.dockPanel.widgetAdded.connect(this.handleWidgetsChanged.bind(this), this);
        this.toDispose.push(this.onDidChangeTrackableWidgetsEmitter);
        this.diffSelectWidget.hide();
        this.update();
    }

    toggleComparisonVisibility(): void {
        if (this.diffSelectWidget.isHidden) {
            this.diffSelectWidget.show();
        } else {
            this.diffSelectWidget.hide();
        }
        this.update();
    }

    dispose(): void {
        this.toDispose.dispose();
        super.dispose();
    }

    protected dockPanelHoldsWidgets(): boolean {
        const iter = this.dockPanel.tabBars();
        let tabBar = iter.next();
        while (tabBar) {
            if (tabBar.titles.length) {
                return true;
            }
            tabBar = iter.next();
        }
        return false;
    }

    protected handleWidgetsChanged(): void {
        if (this.dockPanelHoldsWidgets()) {
            this.placeholderWidget.hide();
        } else {
            this.placeholderWidget.show();
        }
    }

    protected handleWidgetRemoved(_sender: Widget, widgetRemoved: Widget): void {
        if (widgetRemoved instanceof MemoryWidget) { // Sometimes it's the tabbar.
            this.handleWidgetsChanged();
            this.shell.activateWidget(this.id);
        }
    }

    protected async createAndFocusWidget(): Promise<void> {
        const widget = await this.memoryWidgetManager.createNewMemoryWidget();
        widget.activate();
    }

    protected async onAfterShow(msg: Message): Promise<void> {
        if (!this.hasGeneratedWidgetAutomatically && !this.dockPanelHoldsWidgets()) {
            await this.createAndFocusWidget();
            this.hasGeneratedWidgetAutomatically = true;
        }
        super.onAfterShow(msg);
    }

    getTrackableWidgets(): Widget[] {
        const children: Widget[] = [];
        const childIterator = this.dockPanel.children();
        let currentChild = childIterator.next();
        while (currentChild) {
            children.push(currentChild);
            currentChild = childIterator.next();
        }
        return children;
    }

    activateWidget(id: string): Widget | undefined {
        const widget = this.getTrackableWidgets().find(candidateWidget => candidateWidget.id === id);
        if (widget) {
            this.dockPanel.activateWidget(widget);
        }
        return widget;
    }

    onActivateRequest(msg: Message): void {
        const displayedWidget = this.dockPanel.currentTabBar?.currentTitle?.owner;
        if (displayedWidget) {
            displayedWidget.activate();
        } else {
            // Only happens if you remove all widgets, then close the view.
            this.node.tabIndex = -1;
            this.node.focus();
        }
        super.onActivateRequest(msg);
    }
}
