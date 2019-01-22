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
                area: 'bottom'
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
