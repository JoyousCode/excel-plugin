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
exports.BatchLayer = void 0;
const vscode = __importStar(require("vscode"));
const SyncTypes_1 = require("../../types/SyncTypes");
// 批量提交层
class BatchLayer {
    maxRetries;
    constructor(maxRetries = 3) {
        this.maxRetries = maxRetries;
    }
    // 批量处理同步操作
    async processBatch(operations) {
        const results = [];
        for (const operation of operations) {
            const result = await this.processOperation(operation);
            results.push(result);
        }
        return results;
    }
    // 处理单个同步操作
    async processOperation(operation) {
        operation.status = SyncTypes_1.SyncStatus.PROCESSING;
        try {
            switch (operation.type) {
                case SyncTypes_1.SyncOperationType.FORM_CHANGE:
                    await this.handleFormChange(operation);
                    break;
                case SyncTypes_1.SyncOperationType.EDITOR_CHANGE:
                    await this.handleEditorChange(operation);
                    break;
                case SyncTypes_1.SyncOperationType.HEADER_CHANGE:
                    await this.handleHeaderChange(operation);
                    break;
                case SyncTypes_1.SyncOperationType.CURSOR_CHANGE:
                    await this.handleCursorChange(operation);
                    break;
            }
            operation.status = SyncTypes_1.SyncStatus.COMPLETED;
        }
        catch (error) {
            console.error('[BatchLayer] 处理操作失败:', error);
            operation.status = SyncTypes_1.SyncStatus.FAILED;
            operation.retryCount++;
            // 重试机制
            if (operation.retryCount < this.maxRetries) {
                console.log(`[BatchLayer] 重试操作 ${operation.id}, 重试次数: ${operation.retryCount}`);
                await this.retryOperation(operation);
            }
        }
        return operation;
    }
    // 处理表单变化
    async handleFormChange(operation) {
        if (!operation.data.editor) {
            throw new Error('编辑器不存在');
        }
        const editor = operation.data.editor;
        const cellChange = operation.data;
        if (!editor || !cellChange) {
            throw new Error('缺少必要的数据');
        }
        const document = editor.document;
        const lineIndex = cellChange.lineNumber - 1;
        if (lineIndex >= 0 && lineIndex < document.lineCount) {
            const line = document.lineAt(lineIndex);
            const lineText = line.text;
            // 解析行数据
            const cells = lineText.includes('\t') ? lineText.split('\t') : lineText.split(',');
            // 找到列对应的索引
            const columnIndex = operation.data.headers.indexOf(cellChange.column);
            if (columnIndex >= 0) {
                // 更新单元格值
                cells[columnIndex] = cellChange.value;
                // 重新组合行数据
                const newLineText = cells.join('\t');
                // 创建编辑操作
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, line.range, newLineText);
                // 应用编辑
                await vscode.workspace.applyEdit(edit);
            }
        }
    }
    // 处理编辑器变化
    async handleEditorChange(operation) {
        // 编辑器变化已经在编辑器中完成，这里主要是同步到表单
        // 实际实现中会通过事件通知表单更新
        console.log('[BatchLayer] 处理编辑器变化:', operation.data);
    }
    // 处理表头变化
    async handleHeaderChange(operation) {
        // 表头变化已经在相应的处理函数中完成
        // 实际实现中会通过事件通知相关组件更新
        console.log('[BatchLayer] 处理表头变化:', operation.data);
    }
    // 处理光标变化
    async handleCursorChange(operation) {
        // 光标变化已经在编辑器中完成，这里主要是同步到表单
        // 实际实现中会通过事件通知表单更新
        console.log('[BatchLayer] 处理光标变化:', operation.data);
    }
    // 重试操作
    async retryOperation(operation) {
        // 指数退避策略
        const delay = 100 * Math.pow(2, operation.retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.processOperation(operation);
    }
}
exports.BatchLayer = BatchLayer;
//# sourceMappingURL=BatchLayer.js.map