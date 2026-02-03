"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimisticLayer = void 0;
const SyncTypes_1 = require("../../types/SyncTypes");
// 乐观更新层
class OptimisticLayer {
    operationCache = new Map();
    stateCache = new Map();
    // 处理同步操作
    processOperation(operation) {
        // 1. 立即更新本地内存状态
        this.updateLocalState(operation);
        // 2. 立即更新UI显示（通过事件通知）
        this.notifyUIUpdate(operation);
        // 3. 标记为"待同步"
        operation.status = SyncTypes_1.SyncStatus.PENDING;
        // 4. 缓存操作
        this.operationCache.set(operation.id, operation);
        return operation;
    }
    // 更新本地状态
    updateLocalState(operation) {
        const cacheKey = this.getCacheKey(operation);
        const currentState = this.stateCache.get(cacheKey) || {};
        switch (operation.type) {
            case SyncTypes_1.SyncOperationType.FORM_CHANGE:
            case SyncTypes_1.SyncOperationType.EDITOR_CHANGE:
                // 处理单元格变化
                if (operation.data && operation.data.column !== undefined) {
                    const cellKey = `${operation.data.rowIndex || operation.data.cursorRowIndex}:${operation.data.column}`;
                    currentState[cellKey] = operation.data.value;
                }
                break;
            case SyncTypes_1.SyncOperationType.HEADER_CHANGE:
                currentState.headers = operation.data.headers;
                currentState.headerRowIndex = operation.data.headerRowIndex;
                break;
            case SyncTypes_1.SyncOperationType.CURSOR_CHANGE:
                currentState.cursorRowIndex = operation.data.cursorRowIndex;
                break;
        }
        this.stateCache.set(cacheKey, currentState);
    }
    // 通知UI更新
    notifyUIUpdate(operation) {
        // 这里通过事件系统通知UI更新
        // 实际实现中会调用相应的回调函数
        console.log('[OptimisticLayer] 通知UI更新:', operation.type, operation.data);
    }
    // 获取缓存键
    getCacheKey(operation) {
        if (operation.data && operation.data.editor) {
            return operation.data.editor.document.fileName;
        }
        return 'default';
    }
    // 获取本地状态
    getLocalState(key) {
        return this.stateCache.get(key);
    }
    // 清除缓存
    clearCache() {
        this.operationCache.clear();
        this.stateCache.clear();
    }
    // 移除操作
    removeOperation(operationId) {
        this.operationCache.delete(operationId);
    }
    // 获取待同步操作
    getPendingOperations() {
        return Array.from(this.operationCache.values())
            .filter(operation => operation.status === SyncTypes_1.SyncStatus.PENDING);
    }
}
exports.OptimisticLayer = OptimisticLayer;
//# sourceMappingURL=OptimisticLayer.js.map