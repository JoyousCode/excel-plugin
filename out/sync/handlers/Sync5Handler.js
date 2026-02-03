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
exports.Sync5Handler = void 0;
const vscode = __importStar(require("vscode"));
class Sync5Handler {
    static debounceTimer = null;
    static DEBOUNCE_MS = 50;
    static isUpdatingForm = false;
    static isUpdatingEditor = false;
    static handleEditorToForm(context) {
        if (Sync5Handler.isUpdatingForm || context.isEditorChangeFromExtension || context.isEditingForm) {
            return;
        }
        if (Sync5Handler.debounceTimer) {
            clearTimeout(Sync5Handler.debounceTimer);
        }
        Sync5Handler.debounceTimer = setTimeout(() => {
            Sync5Handler.executeEditorToForm(context);
        }, Sync5Handler.DEBOUNCE_MS);
    }
    static handleFormToEditor(context) {
        if (Sync5Handler.isUpdatingEditor) {
            return;
        }
        if (Sync5Handler.debounceTimer) {
            clearTimeout(Sync5Handler.debounceTimer);
        }
        Sync5Handler.debounceTimer = setTimeout(() => {
            Sync5Handler.executeFormToEditor(context);
        }, Sync5Handler.DEBOUNCE_MS);
    }
    static executeEditorToForm(context) {
        try {
            Sync5Handler.isUpdatingForm = true;
            const document = context.editor.document;
            const cursorLine = document.lineAt(context.cursorRowIndex - 1);
            const cells = cursorLine.text.split('\t');
            const rowData = {};
            context.headers.forEach((header, index) => {
                rowData[header] = cells[index] || '';
            });
            context.sidebarProvider.postMessage({
                type: 'selectRow',
                rowData: rowData,
                rowIndex: context.cursorRowIndex - 1,
                lineNumber: context.cursorRowIndex
            });
            console.log('[Sync5] 编辑器已同步到表单 (表首行>光标行)');
        }
        catch (error) {
            console.error('[Sync5] 编辑器到表单同步失败:', error);
        }
        finally {
            Sync5Handler.isUpdatingForm = false;
        }
    }
    static executeFormToEditor(context) {
        try {
            Sync5Handler.isUpdatingEditor = true;
            const document = context.editor.document;
            const line = document.lineAt(context.cursorRowIndex - 1);
            const cells = line.text.split('\t');
            const columnIndex = context.headers.indexOf(context.column);
            if (columnIndex === -1) {
                console.warn('[Sync5] 列不存在:', context.column);
                return;
            }
            cells[columnIndex] = context.value;
            const newLineText = cells.join('\t');
            const range = new vscode.Range(context.cursorRowIndex - 1, 0, context.cursorRowIndex - 1, line.text.length);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, range, newLineText);
            vscode.workspace.applyEdit(edit);
            console.log('[Sync5] 表单已同步到编辑器 (表首行>光标行)');
        }
        catch (error) {
            console.error('[Sync5] 表单到编辑器同步失败:', error);
        }
        finally {
            Sync5Handler.isUpdatingEditor = false;
        }
    }
    static clear() {
        if (Sync5Handler.debounceTimer) {
            clearTimeout(Sync5Handler.debounceTimer);
            Sync5Handler.debounceTimer = null;
        }
        Sync5Handler.isUpdatingForm = false;
        Sync5Handler.isUpdatingEditor = false;
    }
}
exports.Sync5Handler = Sync5Handler;
//# sourceMappingURL=Sync5Handler.js.map