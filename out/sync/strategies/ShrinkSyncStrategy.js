"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShrinkSyncStrategy = void 0;
const BaseSyncStrategy_1 = require("./BaseSyncStrategy");
const SyncTypes_1 = require("../../types/SyncTypes");
// 收缩同步策略（表头行大于当前行时使用）
class ShrinkSyncStrategy extends BaseSyncStrategy_1.BaseSyncStrategy {
    constructor() {
        super('ShrinkSyncStrategy');
    }
    // 执行同步操作
    async execute(operation) {
        if (!this.validateOperation(operation)) {
            return false;
        }
        try {
            console.log(`[ShrinkSyncStrategy] 执行收缩同步操作:`, operation.type);
            // 处理收缩场景下的同步逻辑
            switch (operation.type) {
                case SyncTypes_1.SyncOperationType.FORM_CHANGE:
                    // 表单变化同步到编辑器
                    await this.syncFormToEditor(operation);
                    break;
                case SyncTypes_1.SyncOperationType.EDITOR_CHANGE:
                    // 编辑器变化同步到表单
                    await this.syncEditorToForm(operation);
                    break;
                case SyncTypes_1.SyncOperationType.HEADER_CHANGE:
                    // 表头变化同步到相关组件
                    await this.syncHeaderChanges(operation);
                    break;
                case SyncTypes_1.SyncOperationType.CURSOR_CHANGE:
                    // 光标变化同步到表单
                    await this.syncCursorChanges(operation);
                    break;
            }
            return true;
        }
        catch (error) {
            this.handleError(error, operation);
            return false;
        }
    }
    // 检查是否可以处理该操作
    canHandle(operation) {
        // 当表头行大于当前行时使用此策略
        // 实际实现中会检查headerRowIndex是否大于currentRowIndex
        if (operation.data && operation.data.headerRowIndex !== undefined && operation.data.cursorRowIndex !== undefined) {
            return operation.data.headerRowIndex > operation.data.cursorRowIndex;
        }
        return false;
    }
    // 同步表单到编辑器
    async syncFormToEditor(operation) {
        // 实际实现中会调用BatchLayer的相关方法
        console.log('[ShrinkSyncStrategy] 同步表单到编辑器:', operation.data);
    }
    // 同步编辑器到表单
    async syncEditorToForm(operation) {
        // 实际实现中会调用相应的同步方法
        console.log('[ShrinkSyncStrategy] 同步编辑器到表单:', operation.data);
    }
    // 同步表头变化
    async syncHeaderChanges(operation) {
        // 实际实现中会调用相应的同步方法
        console.log('[ShrinkSyncStrategy] 同步表头变化:', operation.data);
    }
    // 同步光标变化
    async syncCursorChanges(operation) {
        // 实际实现中会调用相应的同步方法
        console.log('[ShrinkSyncStrategy] 同步光标变化:', operation.data);
    }
}
exports.ShrinkSyncStrategy = ShrinkSyncStrategy;
//# sourceMappingURL=ShrinkSyncStrategy.js.map