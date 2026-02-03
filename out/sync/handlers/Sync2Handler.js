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
exports.Sync2Handler = void 0;
const vscode = __importStar(require("vscode"));
class Sync2Handler {
    static debounceTimer = null;
    static DEBOUNCE_MS = 50;
    static isUpdatingCursor = false;
    static isUpdatingCurrentRow = false;
    static handleCursorToCurrentRow(context) {
        if (Sync2Handler.isUpdatingCurrentRow || context.isUpdatingFromExtension) {
            return;
        }
        if (Sync2Handler.debounceTimer) {
            clearTimeout(Sync2Handler.debounceTimer);
        }
        Sync2Handler.debounceTimer = setTimeout(() => {
            Sync2Handler.executeCursorToCurrentRow(context);
        }, Sync2Handler.DEBOUNCE_MS);
    }
    static handleCurrentRowToCursor(context) {
        if (Sync2Handler.isUpdatingCursor || context.isUpdatingFromExtension) {
            return;
        }
        if (Sync2Handler.debounceTimer) {
            clearTimeout(Sync2Handler.debounceTimer);
        }
        Sync2Handler.debounceTimer = setTimeout(() => {
            Sync2Handler.executeCurrentRowToCursor(context);
        }, Sync2Handler.DEBOUNCE_MS);
    }
    static executeCursorToCurrentRow(context) {
        try {
            Sync2Handler.isUpdatingCurrentRow = true;
            const targetLineNumber = context.cursorRowIndex;
            context.sidebarProvider.postMessage({
                type: 'updateCurrentRowInput',
                currentLineNumber: targetLineNumber
            });
            console.log('[Sync2] 光标行已同步到当前行输入框:', targetLineNumber);
        }
        catch (error) {
            console.error('[Sync2] 光标行到当前行同步失败:', error);
        }
        finally {
            Sync2Handler.isUpdatingCurrentRow = false;
        }
    }
    static executeCurrentRowToCursor(context) {
        try {
            Sync2Handler.isUpdatingCursor = true;
            const targetLineNumber = context.currentRowValue;
            const document = context.editor.document;
            const lineCount = document.lineCount;
            if (targetLineNumber < 1 || targetLineNumber > lineCount) {
                console.warn('[Sync2] 目标行号超出范围:', targetLineNumber);
                return;
            }
            const position = new vscode.Position(targetLineNumber - 1, 0);
            const newSelection = new vscode.Selection(position, position);
            context.editor.selection = newSelection;
            context.editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
            console.log('[Sync2] 当前行输入框已同步到光标行:', targetLineNumber);
        }
        catch (error) {
            console.error('[Sync2] 当前行到光标行同步失败:', error);
        }
        finally {
            Sync2Handler.isUpdatingCursor = false;
        }
    }
    static clear() {
        if (Sync2Handler.debounceTimer) {
            clearTimeout(Sync2Handler.debounceTimer);
            Sync2Handler.debounceTimer = null;
        }
        Sync2Handler.isUpdatingCursor = false;
        Sync2Handler.isUpdatingCurrentRow = false;
    }
}
exports.Sync2Handler = Sync2Handler;
//# sourceMappingURL=Sync2Handler.js.map