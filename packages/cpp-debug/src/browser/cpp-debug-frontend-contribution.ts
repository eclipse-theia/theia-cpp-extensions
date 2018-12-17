import { injectable } from "inversify";
import { AbstractViewContribution, OpenViewArguments } from "@theia/core/lib/browser";
import { Command, CommandRegistry, MenuModelRegistry } from "@theia/core/lib/common";
import { MemoryView } from "./cpp-memory-widget";

export const MemoryCommand: Command = { id: 'cpp.command' }

@injectable()
export class CppContribution extends AbstractViewContribution<MemoryView> {

    constructor() {
        super({
            widgetId: MemoryView.ID,
            widgetName: MemoryView.LABEL,
            defaultWidgetOptions: {
                area: 'left'
            },
            toggleCommandId: MemoryCommand.id,
        });
    }

    async openView(_args?: Partial<OpenViewArguments>): Promise<MemoryView> {
        return super.openView({ activate: true });
    }

    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
    }
}
