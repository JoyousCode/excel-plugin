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
exports.Sync6Handler = void 0;
const vscode = __importStar(require("vscode"));
class Sync6Handler {
    static debounceTimer = null;
    static DEBOUNCE_MS = 50;
    static isUpdating = false;
    static handle(context) {
        if (Sync6Handler.isUpdating) {
            return;
        }
        if (Sync6Handler.debounceTimer) {
            clearTimeout(Sync6Handler.debounceTimer);
        }
        Sync6Handler.debounceTimer = setTimeout(() => {
            Sync6Handler.executeSync(context);
        }, Sync6Handler.DEBOUNCE_MS);
    }
    static executeSync(context) {
        try {
            Sync6Handler.isUpdating = true;
            const document = context.editor.document;
            const headerLine = document.lineAt(context.headerRowIndex - 1);
            const cells = headerLine.text.split('\t');
            const columnIndex = context.headers.indexOf(context.column);
            if (columnIndex === -1) {
                console.warn('[Sync6] 列不存在:', context.column);
                return;
            }
            cells[columnIndex] = context.value;
            const newLineText = cells.join('\t');
            const range = new vscode.Range(context.headerRowIndex - 1, 0, context.headerRowIndex - 1, headerLine.text.length);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, range, newLineText);
            vscode.workspace.applyEdit(edit);
            const newHeaders = cells.map(h => h.trim());
            context.headers = newHeaders;
            context.sidebarProvider.postMessage({
                type: 'updateHeaders',
                headers: newHeaders
            });
            console.log('[Sync6] 表单值已同步到表头:', context.column, '=', context.value);
        }
        catch (error) {
            console.error('[Sync6] 同步失败:', error);
        }
        finally {
            Sync6Handler.isUpdating = false;
        }
    }
    static clear() {
        if (Sync6Handler.debounceTimer) {
            clearTimeout(Sync6Handler.debounceTimer);
            Sync6Handler.debounceTimer = null;
        }
        Sync6Handler.isUpdating = false;
    }
}
exports.Sync6Handler = Sync6Handler;
//# sourceMappingURL=Sync6Handler.js.map