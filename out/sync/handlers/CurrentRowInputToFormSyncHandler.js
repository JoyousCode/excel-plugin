"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentRowInputToFormSyncHandler = void 0;
const DebounceUtils_1 = require("../utils/DebounceUtils");
class CurrentRowInputToFormSyncHandler {
    static DEBOUNCE_DELAY = 50;
    static SYNC_KEY = 'currentRowInputToForm';
    static handle(context) {
        const { sidebarProvider, editor, headers, headerRowIndex, currentRowInputValue, isUpdatingFromExtension } = context;
        if (!sidebarProvider || !editor) {
            console.warn('[CurrentRowInputToFormSyncHandler] 缺少必要的上下文');
            return;
        }
        if (isUpdatingFromExtension) {
            console.log('[CurrentRowInputToFormSyncHandler] 跳过同步: 正在从扩展更新');
            return;
        }
        if (currentRowInputValue < 1 || currentRowInputValue > editor.document.lineCount) {
            console.warn(`[CurrentRowInputToFormSyncHandler] 无效的当前行值: ${currentRowInputValue}`);
            return;
        }
        DebounceUtils_1.DebounceUtils.debounce(this.SYNC_KEY, () => {
            this.syncCurrentRowToForm(editor, headers, headerRowIndex, currentRowInputValue, sidebarProvider);
        }, this.DEBOUNCE_DELAY);
    }
    static syncCurrentRowToForm(editor, headers, headerRowIndex, currentRowInputValue, sidebarProvider) {
        try {
            const document = editor.document;
            const targetLineNumber = currentRowInputValue - 1;
            if (targetLineNumber < 0 || targetLineNumber >= document.lineCount) {
                console.warn(`[CurrentRowInputToFormSyncHandler] 目标行索引超出范围: ${targetLineNumber}`);
                return;
            }
            const line = document.lineAt(targetLineNumber);
            const rowData = this.parseRowData(line.text, headers);
            const rowIndex = targetLineNumber - headerRowIndex;
            console.log(`[CurrentRowInputToFormSyncHandler] 同步当前行 ${currentRowInputValue} 到表单:`, rowData);
            sidebarProvider.postMessage({
                type: 'selectRow',
                rowData: rowData,
                rowIndex: rowIndex,
                lineNumber: currentRowInputValue
            });
        }
        catch (error) {
            console.error('[CurrentRowInputToFormSyncHandler] 同步失败:', error);
        }
    }
    static parseRowData(line, headers) {
        const rowData = {};
        let values;
        if (!line || line.trim() === '') {
            headers.forEach(header => {
                rowData[header] = '';
            });
            return rowData;
        }
        if (line.includes('\t')) {
            values = line.split('\t');
        }
        else if (line.includes(',')) {
            values = line.split(',');
        }
        else {
            values = [line];
        }
        headers.forEach((header, index) => {
            rowData[header] = values[index] !== undefined ? values[index].trim() : '';
        });
        return rowData;
    }
    static clear() {
        DebounceUtils_1.DebounceUtils.clear(this.SYNC_KEY);
    }
}
exports.CurrentRowInputToFormSyncHandler = CurrentRowInputToFormSyncHandler;
//# sourceMappingURL=CurrentRowInputToFormSyncHandler.js.map