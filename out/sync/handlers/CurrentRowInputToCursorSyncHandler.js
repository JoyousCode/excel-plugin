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
exports.CurrentRowInputToCursorSyncHandler = void 0;
const vscode = __importStar(require("vscode"));
const BaseSyncHandler_1 = require("../core/BaseSyncHandler");
class CurrentRowInputToCursorSyncHandler extends BaseSyncHandler_1.BaseSyncHandler {
    constructor(options) {
        super(options);
    }
    canHandle(event) {
        return event.type === 'currentRowInputToCursor';
    }
    handle(event) {
        if (!this.shouldProcessEvent(event)) {
            return;
        }
        const cursorEvent = event;
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
            }
            else {
                this.logError('无效的行号', { targetLine, lineCount: editor.document.lineCount });
            }
        }
        catch (error) {
            this.logError('移动光标失败', error);
        }
    }
}
exports.CurrentRowInputToCursorSyncHandler = CurrentRowInputToCursorSyncHandler;
//# sourceMappingURL=CurrentRowInputToCursorSyncHandler.js.map