
import { ContainerModule } from "inversify";
import { MemoryView } from "./cpp-memory-widget";
import { CppContribution } from './cpp-debug-frontend-contribution';
import { bindViewContribution, WidgetFactory } from "@theia/core/lib/browser";

import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {
    bindViewContribution(bind, CppContribution);
    bind(MemoryView).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: MemoryView.ID,
        createWidget: () => ctx.container.get<MemoryView>(MemoryView)
    })).inSingletonScope();
});
