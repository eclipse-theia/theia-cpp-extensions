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

import { injectable } from 'inversify';
import { AbstractViewContribution, OpenViewArguments } from '@theia/core/lib/browser';
import { Command, CommandRegistry, MenuModelRegistry } from '@theia/core/lib/common';
import { MemoryView } from './cpp-memory-widget';
import { InfoView } from './cpp-info-widget';
/**
 * Command used to toggle the memory view.
 */
export const MemoryCommand: Command = { id: 'cpp.command' };
export const InfoCommand: Command = { id: 'cpp.info.command' };

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

    /**
     * Open the memory view widget.
     * @param _args optional open view arguments.
     * @returns a promise resolving to the memory view widget.
     */
    async openView(_args?: Partial<OpenViewArguments>): Promise<MemoryView> {
        return super.openView({ activate: true });
    }

    /**
     * Register commands for the contribution.
     * @param registry the command registry.
     */
    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    /**
     * Register menus for the contribution.
     * @param registry the menu model registry.
     */
    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
    }
}

@injectable()
export class CppContributionInfo extends AbstractViewContribution<InfoView> {

    constructor() {
        super({
            widgetId: InfoView.ID,
            widgetName: InfoView.LABEL,
            defaultWidgetOptions: {
                area: 'left'
            },
            toggleCommandId: InfoCommand.id,
        });
    }

    /**
     * Open the memory view widget.
     * @param _args optional open view arguments.
     * @returns a promise resolving to the memory view widget.
     */
    async openView(_args?: Partial<OpenViewArguments>): Promise<InfoView> {
        return super.openView({ activate: true });
    }

    /**
     * Register commands for the contribution.
     * @param registry the command registry.
     */
    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
    }

    /**
     * Register menus for the contribution.
     * @param registry the menu model registry.
     */
    registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
    }
}
