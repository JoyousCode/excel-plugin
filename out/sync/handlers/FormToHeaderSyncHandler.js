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
exports.FormToHeaderSyncHandler = void 0;
const vscode = __importStar(require("vscode"));
const BaseSyncHandler_1 = require("../core/BaseSyncHandler");
class FormToHeaderSyncHandler extends BaseSyncHandler_1.BaseSyncHandler {
    constructor(options) {
        super(options);
    }
    canHandle(event) {
        if (event.type === 'formChange') {
            const formEvent = event;
            return formEvent.headerRowIndex === formEvent.cursorRowIndex;
        }
        return false;
    }
    handle(event) {
        if (!this.shouldProcessEvent(event)) {
            return;
        }
        const formEvent = event;
        this.log('处理表单变更事件（表首行 = 光标行，同步到表头）', {
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
        }
        catch (error) {
            this.logError('同步表单到表头失败', error);
        }
    }
    syncFormToHeader(event) {
        const editor = event.editor;
        const headerLine = event.headerRowIndex - 1;
        if (headerLine < 0 || headerLine >= editor.document.lineCount) {
            this.logError('无效的表首行', { headerLine, lineCount: editor.document.lineCount });
            return;
        }
        const lineText = editor.document.lineAt(headerLine).text;
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
                }
                else {
                    this.logError('更新表头失败', { success });
                }
            });
        }
    }
}
exports.FormToHeaderSyncHandler = FormToHeaderSyncHandler;
//# sourceMappingURL=FormToHeaderSyncHandler.js.map