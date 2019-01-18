
import { ContainerModule } from "inversify";
import { MemoryView } from "./cpp-memory-widget";
import { CppContribution } from './cpp-debug-frontend-contribution';
import { bindViewContribution, WidgetFactory } from "@theia/core/lib/browser";
import { MemoryProvider, MemoryProviderImpl } from "./memory-provider";

import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {
    bindViewContribution(bind, CppContribution);
    bind(MemoryProvider).to(MemoryProviderImpl).inSingletonScope();
    bind(MemoryView).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: MemoryView.ID,
        createWidget: () => ctx.container.get<MemoryView>(MemoryView)
    })).inSingletonScope();
});
