import * as vscode from 'vscode';
import { BaseSyncHandler, SyncHandlerOptions } from '../core/BaseSyncHandler';
import { FormChangeEvent, SyncEventData } from '../core/SyncTypes';

export class FormToHeaderSyncHandler extends BaseSyncHandler {
  constructor(options: SyncHandlerOptions) {
    super(options);
  }

  public canHandle(event: SyncEventData): boolean {
    if (event.type === 'formChange') {
      const formEvent = event as FormChangeEvent;
      return formEvent.headerRowIndex === formEvent.cursorRowIndex;
    }
    return false;
  }

  public handle(event: SyncEventData): Promise<void> | void {
    if (!this.shouldProcessEvent(event)) {
      return;
    }

    const formEvent = event as FormChangeEvent;
    this.log('处理表单变更事件（表头行 = 光标行，同步到表头）', {
      column: formEvent.column,
      value: formEvent.value,
      headerRowIndex: formEvent.headerRowIndex,
      cursorRowIndex: formEvent.cursorRowIndex
    });

    if (formEvent.isEditingForm) {
      this.log('跳过处理：正在编辑表单');
      return;
    }

    if (formEvent.isEditorChangeFromExtension) {
      this.log('跳过处理：由扩展触发的编辑器变更');
      return;
    }

    try {
      this.syncFormToHeader(formEvent);
      this.log('表单数据已同步到表头');
    } catch (error) {
      this.logError('同步表单到表头失败', error);
    }
  }

  private syncFormToHeader(event: FormChangeEvent): void {
    const editor = event.editor;
    const headerLine = event.headerRowIndex - 1;
    
    if (headerLine < 0 || headerLine >= editor.document.lineCount) {
      this.logError('无效的表头行', { headerLine, lineCount: editor.document.lineCount });
      return;
    }

    const lineText = editor.document.lineAt(headerLine).text;
    let cells: string[] = [];

    if (lineText.includes('\t')) {
      cells = lineText.split('\t');
    } else if (lineText.includes(',')) {
      cells = lineText.split(',');
    } else {
      cells = [lineText];
    }

    const columnIndex = event.headers.indexOf(event.column);
    if (columnIndex >= 0) {
      while (cells.length <= columnIndex) {
        cells.push('');
      }
      cells[columnIndex] = event.value;

      const newLineText = cells.join(lineText.includes('\t') ? '\t' : ',');
      const range = new vscode.Range(headerLine, 0, headerLine, lineText.length);
      
      const edit = new vscode.WorkspaceEdit();
      edit.replace(editor.document.uri, range, newLineText);
      
      vscode.workspace.applyEdit(edit).then(success => {
        if (success) {
          this.log('表头已更新');
          
          const updatedHeaders = [...event.headers];
          updatedHeaders[columnIndex] = event.value;
          
          this.sidebarProvider.updateHeaders(updatedHeaders);
          this.log('表单表头已更新');
        } else {
          this.logError('更新表头失败', { success });
        }
      });
    }
  }
}
