import * as React from 'react';
import { injectable, postConstruct } from 'inversify';
import { ReactWidget, Message } from '@theia/core/lib/browser';

@injectable()
export class MemoryView extends ReactWidget {

    static readonly ID = 'memory.view';
    static readonly LABEL = 'Memory';

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = MemoryView.ID;
        this.title.label = MemoryView.LABEL;
        this.title.caption = MemoryView.LABEL;
        this.title.closable = true;
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.focusSearchField();
    }

    protected findSearchField(): HTMLInputElement | null {
        return document.getElementById('t-mv-search') as HTMLInputElement;
    }

    protected focusSearchField(): void {
        const input = this.findSearchField();
        if (input) {
            (input as HTMLInputElement).focus();
            (input as HTMLInputElement).select();
        }
    }

    protected render(): React.ReactNode {
        return <div className='t-mv-container'>
            {this.renderHeader()}
            {this.renderSearchField()}
            {this.renderView()}
        </div>;
    }

    protected renderHeader(): React.ReactNode {
        return <div className='t-mv-header'>
            <h1>Memory View</h1>
            <div id='refresh-action' title='Refresh'>
                <i className='fa fa-refresh' />
            </div>
        </div>;
    }

    protected renderSearchField(): React.ReactNode {
        return <div className='t-mv-search-container'>
            <div className='label t-mv-search-label'>Memory Address</div>
            <input id='t-mv-search' type='text' />
        </div>;
    }

    protected renderView(): React.ReactNode {
        const rows = this.renderViewRows();
        return <div id='t-mv-search-view-container'>
            <table id='t-mv-search-view'>
                <thead>
                    <tr>
                        <th>
                            <span className='t-mv-header-label'>Address</span>
                        </th>
                        <th>
                            <span className='t-mv-header-label'>Data</span>
                        </th>
                        <th>
                            <span className='t-mv-header-label'>Code</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        </div>
    }

    protected renderViewRows(): React.ReactNode {
        const items = [
            ['oX100001', '0000 0000 0000 0000 0000 0000 0000 0001', '..x...x..x...x..x...x'],
            ['oX100001', '0000 0000 0000 0000 0000 0000 0000 0001', '..x...x..x...x..x...x'],
            ['oX100001', '0000 0000 0000 0000 0000 0000 0000 0001', '..x...x..x...x..x...x'],
            ['oX100001', '0000 0000 0000 0000 0000 0000 0000 0001', '..x...x..x...x..x...x'],
            ['oX100001', '0000 0000 0000 0000 0000 0000 0000 0001', '..x...x..x...x..x...x'],
            ['oX100001', '0000 0000 0000 0000 0000 0000 0000 0001', '..x...x..x...x..x...x'],
            ['oX100001', '0000 0000 0000 0000 0000 0000 0000 0001', '..x...x..x...x..x...x'],
            ['oX100001', '0000 0000 0000 0000 0000 0000 0000 0001', '..x...x..x...x..x...x'],
            ['oX100001', '0000 0000 0000 0000 0000 0000 0000 0001', '..x...x..x...x..x...x'],
        ]
        return <React.Fragment>
            {
                items.map((item, index) =>
                    <tr className='t-mv-search-view-row' key={index}>
                        <td className='t-mv-search-view-address'>{item[0]}</td>
                        <td className='t-mv-search-view-data'>{item[1]}</td>
                        <td className='t-mv-search-view-code'>{item[2]}</td>
                    </tr>
                )
            }
        </React.Fragment>;
    }

    protected doRefresh = () => { return };
}
