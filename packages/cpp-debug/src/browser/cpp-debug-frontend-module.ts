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

import { decorate, ContainerModule, inject } from 'inversify';
import { MemoryView } from './cpp-memory-widget';
import { InfoView } from './cpp-info-widget';
import { CppContribution, CppContributionInfo } from './cpp-debug-frontend-contribution';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import { MemoryProvider, MemoryProviderImpl } from './memory-provider';
import { InfoTreeWidget } from './tree/tree-view';
import { DebugViewModel, DebugViewOptions } from '@theia/debug/lib/browser/view//debug-view-model';
import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {
    // bind(DebugThreadsWidget).toSelf();
    bind<InfoTreeWidget>("ThreadsTreeWidget").toDynamicValue(({ container }) => InfoTreeWidget.createWidget(container, 'threads'));
    bind<InfoTreeWidget>("QueuesTreeWidget").toDynamicValue(({ container }) => InfoTreeWidget.createWidget(container, 'queues'));
    bind<InfoTreeWidget>("AgentsTreeWidget").toDynamicValue(({ container }) => InfoTreeWidget.createWidget(container, 'agents'));
    bind<InfoTreeWidget>("DispatchesTreeWidget").toDynamicValue(({ container }) => InfoTreeWidget.createWidget(container, 'dispatche'));
    bindViewContribution(bind, CppContribution);
    bindViewContribution(bind, CppContributionInfo);
    bind(MemoryProvider).to(MemoryProviderImpl).inSingletonScope();
    bind(MemoryView).toSelf();
    bind(InfoView).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: MemoryView.ID,
        createWidget: () => ctx.container.get<MemoryView>(MemoryView)
    })).inSingletonScope();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: InfoView.ID,
        createWidget: () => ctx.container.get<InfoView>(InfoView)
    })).inSingletonScope();
    bind(DebugViewOptions).toConstantValue({});
    bind(DebugViewModel).toSelf();
    /* bind(DebugCallStackItemTypeKey).toDynamicValue(({ container }) =>
        container.get(ContextKeyService).createKey('callStackItemType', undefined)
    ).inSingletonScope();

    bindContributionProvider(bind, DebugSessionContribution);
    bind(DebugSessionFactory).to(DefaultDebugSessionFactory).inSingletonScope();
    bind(DebugSessionManager).toSelf().inSingletonScope();

    bind(BreakpointManager).toSelf().inSingletonScope();
    bind(DebugEditorModelFactory).toDynamicValue(({ container }) => <DebugEditorModelFactory>(editor =>
        DebugEditorModel.createModel(container, editor)
    )).inSingletonScope();
    bind(DebugEditorService).toSelf().inSingletonScope().onActivation((context, service) => {
        context.container.get(MonacoEditorService).registerDecorationType(DebugBreakpointWidget.PLACEHOLDER_DECORATION, {});
        return service;
    });

    bind(DebugSessionWidgetFactory).toDynamicValue(({ container }) =>
        (options: DebugViewOptions) => DebugSessionWidget.createWidget(container, options)
    ).inSingletonScope();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: DebugWidget.ID,
        createWidget: () => DebugWidget.createWidget(container)
    })).inSingletonScope();
    DebugConsoleContribution.bindContribution(bind);

    bind(DebugSchemaUpdater).toSelf().inSingletonScope();
    bind(JsonSchemaContribution).toService(DebugSchemaUpdater);
    bind(DebugConfigurationManager).toSelf().inSingletonScope();

    bind(DebugInlineValueDecorator).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(DebugInlineValueDecorator);

    bind(DebugService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, DebugPath)).inSingletonScope();
    bind(DebugResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toService(DebugResourceResolver);

    bind(KeybindingContext).to(InDebugModeContext).inSingletonScope();
    bind(KeybindingContext).to(BreakpointWidgetInputFocusContext).inSingletonScope();
    bind(KeybindingContext).to(BreakpointWidgetInputStrictFocusContext).inSingletonScope();
    bindViewContribution(bind, DebugFrontendApplicationContribution);
    bind(FrontendApplicationContribution).toService(DebugFrontendApplicationContribution);
    bind(TabBarToolbarContribution).toService(DebugFrontendApplicationContribution);
    bind(ColorContribution).toService(DebugFrontendApplicationContribution);

    bind(DebugSessionContributionRegistryImpl).toSelf().inSingletonScope();
    bind(DebugSessionContributionRegistry).toService(DebugSessionContributionRegistryImpl);

    bind(DebugPrefixConfiguration).toSelf().inSingletonScope();
    for (const identifier of [CommandContribution, QuickOpenContribution]) {
        bind(identifier).toService(DebugPrefixConfiguration);
    }

    bindDebugPreferences(bind);
    bindLaunchPreferences(bind);

    bind(DebugWatchManager).toSelf().inSingletonScope();

    bind(DebugTabBarDecorator).toSelf().inSingletonScope();
    bind(TabBarDecorator).toService(DebugTabBarDecorator);
    */
});
