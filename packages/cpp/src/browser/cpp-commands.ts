/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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

import { inject, injectable } from 'inversify';
import { SelectionService, UriSelection } from '@theia/core/lib/common';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { open, OpenerService } from '@theia/core/lib/browser';
import { CppLanguageClientContribution } from './cpp-language-client-contribution';
import { SwitchSourceHeaderRequest } from './cpp-protocol';
import { TextDocumentIdentifier } from '@theia/languages/lib/browser';
import { EditorCommands, EditorManager } from '@theia/editor/lib/browser';
import { HEADER_AND_SOURCE_FILE_EXTENSIONS } from '../common';

/**
 * The C/C++ command category.
 */
const CPP_CATEGORY = 'C/C++';

/**
 * Command to switch between source/header files.
 */
export const SWITCH_SOURCE_HEADER: Command = {
    id: 'switch_source_header',
    category: CPP_CATEGORY,
    label: 'Switch Between Source/Header File',
};

/**
 * Command that is used to show the references from a CodeLens.
 */
export const SHOW_CLANGD_REFERENCES: Command = {
    id: 'clangd.references'
};

/**
 * Command to open the file path.
 * @param path the file path.
 */
export const FILE_OPEN_PATH = (path: string): Command => <Command>{
    id: 'file:openPath'
};

/**
 * Determine if a C/C++ file is currently active (opened).
 * @param editorManager the editor manager if it is defined.
 *
 * @returns `true` if the current active editor is a C/C++ file.
 */
export function editorContainsCppFiles(editorManager: EditorManager | undefined): boolean {
    if (editorManager && editorManager.activeEditor) {
        const uri = editorManager.activeEditor.editor.document.uri;
        return HEADER_AND_SOURCE_FILE_EXTENSIONS.some(value => uri.endsWith('.' + value));
    }
    return false;
}

@injectable()
export class CppCommandContribution implements CommandContribution {

    constructor(
        @inject(CppLanguageClientContribution) protected readonly clientContribution: CppLanguageClientContribution,
        @inject(OpenerService) protected readonly openerService: OpenerService,
        @inject(EditorManager) private editorService: EditorManager,
        protected readonly selectionService: SelectionService
    ) { }

    /**
     * Register commands for C/C++.
     * @param commands the command registry.
     */
    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(SWITCH_SOURCE_HEADER, {
            isEnabled: () => editorContainsCppFiles(this.editorService),
            execute: () => this.switchSourceHeader()
        });
        commands.registerCommand(SHOW_CLANGD_REFERENCES, {
            execute: (doc: TextDocumentIdentifier, pos: Position, locs: Location[]) =>
                commands.executeCommand(EditorCommands.SHOW_REFERENCES.id, doc.uri, pos, locs)
        });
    }

    /**
     * Actually switch the source header.
     */
    protected async switchSourceHeader(): Promise<void> {
        const uri = UriSelection.getUri(this.selectionService.selection);
        if (!uri) {
            return;
        }
        const docIdentifier = TextDocumentIdentifier.create(uri.toString());
        const languageClient = await this.clientContribution.languageClient;
        const sourceUri: string | undefined = await languageClient.sendRequest(SwitchSourceHeaderRequest.type, docIdentifier);
        if (sourceUri !== undefined) {
            open(this.openerService, new URI(sourceUri.toString()));
        }
    }

}
