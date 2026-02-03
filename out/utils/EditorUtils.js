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
exports.EditorUtils = void 0;
const vscode = __importStar(require("vscode"));
/**
 * 编辑器工具类
 * 提供处理编辑器光标位置和滚动的方法
 */
class EditorUtils {
    /**
     * 将编辑器光标放到指定行的最前面，并滚动编辑器窗口显示该行
     * @param lineNumber 指定的行号（从1开始）
     * @param editor 可选的编辑器实例，如果不提供则使用当前活动编辑器
     */
    static async gotoLine(lineNumber, editor) {
        console.log(`[EditorUtils] 接收到行号: ${lineNumber}`);
        // 获取编辑器实例
        const targetEditor = editor || vscode.window.activeTextEditor;
        if (!targetEditor) {
            console.warn('[EditorUtils] 没有活动编辑器');
            return;
        }
        // 计算0-based的行索引
        const lineIndex = lineNumber - 1;
        // 创建新的光标位置（行的最前面）
        const position = new vscode.Position(lineIndex, 0);
        // 创建新的选择
        const selection = new vscode.Selection(position, position);
        // 更新编辑器的选择
        targetEditor.selection = selection;
        // 滚动编辑器窗口以显示该行
        await targetEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        console.log(`[EditorUtils] 光标已移动到第 ${lineNumber} 行`);
    }
}
exports.EditorUtils = EditorUtils;
//# sourceMappingURL=EditorUtils.js.map