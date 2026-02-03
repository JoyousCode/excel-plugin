import * as vscode from 'vscode';
import { BaseSyncHandler, SyncHandlerOptions } from '../core/BaseSyncHandler';
import { EditorChangeEvent, FormChangeEvent, SyncEventData } from '../core/SyncTypes';

export class EditorToFormSyncHandler_GreaterThan extends BaseSyncHandler {
  constructor(options: SyncHandlerOptions) {
    super(options);
  }

  public canHandle(event: SyncEventData): boolean {
    if (event.type === 'editorChange') {
      const editorEvent = event as EditorChangeEvent;
      return editorEvent.headerRowIndex > editorEvent.cursorRowIndex;
    }
    return false;
  }

  public handle(event: SyncEventData): Promise<void> | void {
    if (!this.shouldProcessEvent(event)) {
      return;
    }

    const editorEvent = event as EditorChangeEvent;
    this.log('处理编辑器变更事件（表首行 > 光标行）', {
      headerRowIndex: editorEvent.headerRowIndex,
      cursorRowIndex: editorEvent.cursorRowIndex
    });

    if (editorEvent.isEditingForm) {
      this.log('跳过处理：正在编辑表单');
      return;
    }

    if (editorEvent.isEditorChangeFromExtension) {
      this.log('跳过处理：由扩展触发的编辑器变更');
      return;
    }

    try {
      this.syncEditorToForm(editorEvent);
      this.log('编辑器数据已同步到表单');
    } catch (error) {
      this.logError('同步编辑器到表单失败', error);
    }
  }

  private syncEditorToForm(event: EditorChangeEvent): void {
    const editor = event.editor;
    const cursorLine = event.cursorRowIndex - 1;
    
    if (cursorLine < 0 || cursorLine >= editor.document.lineCount) {
      this.logError('无效的光标行', { cursorLine, lineCount: editor.document.lineCount });
      return;
    }

    const lineText = editor.document.lineAt(cursorLine).text;
    let cells: string[] = [];

    if (lineText.includes('\t')) {
      cells = lineText.split('\t');
    } else if (lineText.includes(',')) {
      cells = lineText.split(',');
    } else {
      cells = [lineText];
    }

    const rowData: any = {};
    event.headers.forEach((header, index) => {
      rowData[header] = index < cells.length ? cells[index].trim() : '';
    });

    this.sidebarProvider.selectRow(rowData, event.cursorRowIndex - event.headerRowIndex, event.cursorRowIndex);
  }

  public handleFormToEditor(event: FormChangeEvent): void {
    if (!this.enabled) {
      return;
    }

    this.log('处理表单变更事件（表首行 > 光标行）', {
      column: event.column,
      value: event.value,
      rowIndex: event.rowIndex
    });

    try {
      const editor = event.editor;
      const targetLine = event.cursorRowIndex - 1;
      
      if (targetLine < 0 || targetLine >= editor.document.lineCount) {
        this.logError('无效的目标行', { targetLine, lineCount: editor.document.lineCount });
        return;
      }

      const lineText = editor.document.lineAt(targetLine).text;
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
        const range = new vscode.Range(targetLine, 0, targetLine, lineText.length);
        
        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, range, newLineText);
        
        vscode.workspace.applyEdit(edit).then(success => {
          if (success) {
            this.log('表单数据已同步到编辑器');
          } else {
            this.logError('同步表单到编辑器失败', { success });
          }
        });
      }
    } catch (error) {
      this.logError('同步表单到编辑器失败', error);
    }
  }
}
