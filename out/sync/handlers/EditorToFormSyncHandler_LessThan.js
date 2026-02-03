"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorToFormSyncHandler_LessThan = void 0;
const vscode = __importStar(require("vscode"));
const BaseSyncHandler_1 = require("../core/BaseSyncHandler");
class EditorToFormSyncHandler_LessThan extends BaseSyncHandler_1.BaseSyncHandler {
    constructor(options) {
        super(options);
    }
    canHandle(event) {
        if (event.type === 'editorChange') {
            const editorEvent = event;
            return editorEvent.headerRowIndex < editorEvent.cursorRowIndex;
        }
        return false;
    }
    handle(event) {
        if (!this.shouldProcessEvent(event)) {
            return;
        }
        const editorEvent = event;
        this.log('处理编辑器变更事件（表首行 < 光标行）', {
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
        }
        catch (error) {
            this.logError('同步编辑器到表单失败', error);
        }
    }
    syncEditorToForm(event) {
        const editor = event.editor;
        const cursorLine = event.cursorRowIndex - 1;
        if (cursorLine < 0 || cursorLine >= editor.document.lineCount) {
            this.logError('无效的光标行', { cursorLine, lineCount: editor.document.lineCount });
            return;
        }
        const lineText = editor.document.lineAt(cursorLine).text;
        let cells = [];
        if (lineText.includes('\t')) {
            cells = lineText.split('\t');
        }
        else if (lineText.includes(',')) {
            cells = lineText.split(',');
        }
        else {
            cells = [lineText];
        }
        const rowData = {};
        event.headers.forEach((header, index) => {
            rowData[header] = index < cells.length ? cells[index].trim() : '';
        });
        this.sidebarProvider.selectRow(rowData, event.cursorRowIndex - event.headerRowIndex, event.cursorRowIndex);
    }
    handleFormToEditor(event) {
        if (!this.enabled) {
            return;
        }
        this.log('处理表单变更事件（表首行 < 光标行）', {
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
            let cells = [];
            if (lineText.includes('\t')) {
                cells = lineText.split('\t');
            }
            else if (lineText.includes(',')) {
                cells = lineText.split(',');
            }
            else {
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
                    }
                    else {
                        this.logError('同步表单到编辑器失败', { success });
                    }
                });
            }
        }
        catch (error) {
            this.logError('同步表单到编辑器失败', error);
        }
    }
}
exports.EditorToFormSyncHandler_LessThan = EditorToFormSyncHandler_LessThan;
//# sourceMappingURL=EditorToFormSyncHandler_LessThan.js.map