import * as vscode from 'vscode';
import { BaseSyncHandler, SyncHandlerOptions } from '../core/BaseSyncHandler';
import { CurrentRowInputToCursorEvent, SyncEventData } from '../core/SyncTypes';

export class CurrentRowInputToCursorSyncHandler extends BaseSyncHandler {
  constructor(options: SyncHandlerOptions) {
    super(options);
  }

  public canHandle(event: SyncEventData): boolean {
    return event.type === 'currentRowInputToCursor';
  }

  public handle(event: SyncEventData): Promise<void> | void {
    if (!this.shouldProcessEvent(event)) {
      return;
    }

    const cursorEvent = event as CurrentRowInputToCursorEvent;
    this.log('处理当前行输入变更事件', {
      currentRowValue: cursorEvent.currentRowValue,
      isUpdatingFromExtension: cursorEvent.isUpdatingFromExtension
    });

    if (cursorEvent.isUpdatingFromExtension) {
      this.log('跳过处理：由扩展触发的更新');
      return;
    }

    try {
      const editor = cursorEvent.editor;
      const targetLine = cursorEvent.currentRowValue - 1;

      if (targetLine >= 0 && targetLine < editor.document.lineCount) {
        const newPosition = new vscode.Position(targetLine, 0);
        const newSelection = new vscode.Selection(newPosition, newPosition);
        editor.selection = newSelection;
        
        this.log('光标已移动到指定行', { lineNumber: cursorEvent.currentRowValue });
      } else {
        this.logError('无效的行号', { targetLine, lineCount: editor.document.lineCount });
      }
    } catch (error) {
      this.logError('移动光标失败', error);
    }
  }
}
