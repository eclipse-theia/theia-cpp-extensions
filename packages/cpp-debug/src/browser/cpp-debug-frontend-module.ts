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

import { ContainerModule } from 'inversify';
import { MemoryView } from './cpp-memory-widget';
import { InfoView } from './cpp-info-widget';
import { CppContribution, CppContributionInfo } from './cpp-debug-frontend-contribution';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import { MemoryProvider, MemoryProviderImpl } from './memory-provider';

import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {
    console.log('ContainerModule');
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
});
