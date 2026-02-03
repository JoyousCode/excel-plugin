import * as vscode from 'vscode';
import { BaseSyncHandler, SyncHandlerOptions } from '../core/BaseSyncHandler';
import { CursorRowChangeEvent, CurrentRowInputToCursorEvent, SyncEventData } from '../core/SyncTypes';

export class CursorRowToCurrentRowInputSyncHandler extends BaseSyncHandler {
  constructor(options: SyncHandlerOptions) {
    super(options);
  }

  public canHandle(event: SyncEventData): boolean {
    return event.type === 'cursorRowChange';
  }

  public handle(event: SyncEventData): Promise<void> | void {
    if (!this.shouldProcessEvent(event)) {
      return;
    }

    const cursorEvent = event as CursorRowChangeEvent;
    this.log('处理光标行变更事件', {
      cursorRowIndex: cursorEvent.cursorRowIndex
    });

    try {
      // 只更新当前行输入框的值，不重新渲染表单
      // 因为updateCurrentLineData已经调用了selectRow更新了表单数据
      this.sidebarProvider.updateCurrentRowInput(cursorEvent.cursorRowIndex);
      this.log('当前行输入框已更新');
    } catch (error) {
      this.logError('更新当前行输入框失败', error);
    }
  }
}
