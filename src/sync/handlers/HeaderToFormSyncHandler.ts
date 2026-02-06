import * as vscode from 'vscode';
import { BaseSyncHandler, SyncHandlerOptions } from '../core/BaseSyncHandler';
import { HeaderChangeEvent, SyncEventData } from '../core/SyncTypes';

export class HeaderToFormSyncHandler extends BaseSyncHandler {
  constructor(options: SyncHandlerOptions) {
    super(options);
  }

  public canHandle(event: SyncEventData): boolean {
    return event.type === 'headerChange';
  }

  public handle(event: SyncEventData): Promise<void> | void {
    if (!this.shouldProcessEvent(event)) {
      return;
    }

    const headerEvent = event as HeaderChangeEvent;
    this.log('处理表头行变更事件', {
      headers: headerEvent.headers,
      headerRowIndex: headerEvent.headerRowIndex
    });

    try {
      this.sidebarProvider.updateHeaders(headerEvent.headers);
      this.log('表单表头已更新');
    } catch (error) {
      this.logError('更新表单表头失败', error);
    }
  }
}
