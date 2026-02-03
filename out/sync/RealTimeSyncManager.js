"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeSyncManager = void 0;
const SyncTypes_1 = require("../types/SyncTypes");
const OptimisticLayer_1 = require("./layers/OptimisticLayer");
const IncrementalLayer_1 = require("./layers/IncrementalLayer");
const BatchLayer_1 = require("./layers/BatchLayer");
const DirectSyncStrategy_1 = require("./strategies/DirectSyncStrategy");
const ExpandSyncStrategy_1 = require("./strategies/ExpandSyncStrategy");
const ShrinkSyncStrategy_1 = require("./strategies/ShrinkSyncStrategy");
const VersionManager_1 = require("./utils/VersionManager");
const StateManager_1 = require("./utils/StateManager");
const PriorityQueue_1 = require("./utils/PriorityQueue");
// 实时同步管理器
class RealTimeSyncManager {
    optimisticLayer;
    incrementalLayer;
    batchLayer;
    versionManager;
    stateManager;
    syncQueue;
    syncStrategies;
    config;
    isProcessing = false;
    operationIdCounter = 0;
    // 事件监听器
    eventListeners = new Map();
    constructor(config) {
        this.config = config || {
            batchSize: 10,
            retryCount: 3,
            syncDelay: 0,
            maxConcurrent: 5
        };
        this.optimisticLayer = new OptimisticLayer_1.OptimisticLayer();
        this.incrementalLayer = new IncrementalLayer_1.IncrementalLayer();
        this.batchLayer = new BatchLayer_1.BatchLayer(this.config.retryCount);
        this.versionManager = new VersionManager_1.VersionManager();
        this.stateManager = new StateManager_1.StateManager();
        this.syncQueue = new PriorityQueue_1.PriorityQueue();
        // 初始化同步策略
        this.syncStrategies = [
            new DirectSyncStrategy_1.DirectSyncStrategy(),
            new ExpandSyncStrategy_1.ExpandSyncStrategy(),
            new ShrinkSyncStrategy_1.ShrinkSyncStrategy()
        ];
        console.log('[RealTimeSyncManager] 初始化完成');
    }
    // 处理编辑器变化
    handleEditorChange(event) {
        const operation = this.createSyncOperation({
            type: SyncTypes_1.SyncOperationType.EDITOR_CHANGE,
            source: SyncTypes_1.SyncSource.EDITOR,
            data: event
        });
        this.processSyncOperation(operation);
    }
    // 处理表单变化
    handleFormChange(event) {
        const operation = this.createSyncOperation({
            type: SyncTypes_1.SyncOperationType.FORM_CHANGE,
            source: SyncTypes_1.SyncSource.FORM,
            data: event
        });
        this.processSyncOperation(operation);
    }
    // 处理表头变化
    handleHeaderChange(event) {
        const operation = this.createSyncOperation({
            type: SyncTypes_1.SyncOperationType.HEADER_CHANGE,
            source: SyncTypes_1.SyncSource.SYSTEM,
            data: event
        });
        this.processSyncOperation(operation);
    }
    // 处理光标变化
    handleCursorChange(event) {
        const operation = this.createSyncOperation({
            type: SyncTypes_1.SyncOperationType.CURSOR_CHANGE,
            source: SyncTypes_1.SyncSource.EDITOR,
            data: event
        });
        this.processSyncOperation(operation);
    }
    // 处理同步操作
    processSyncOperation(operation) {
        // 1. 乐观更新层处理
        const processedOperation = this.optimisticLayer.processOperation(operation);
        // 2. 添加到同步队列
        this.syncQueue.enqueue(processedOperation, this.getOperationPriority(processedOperation));
        // 3. 触发同步处理
        this.triggerSyncProcessing();
    }
    // 触发同步处理
    async triggerSyncProcessing() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        try {
            await this.processSyncQueue();
        }
        catch (error) {
            console.error('[RealTimeSyncManager] 处理同步队列时出错:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    // 处理同步队列
    async processSyncQueue() {
        const operations = [];
        // 批量取出操作
        while (!this.syncQueue.isEmpty() && operations.length < this.config.batchSize) {
            const operation = this.syncQueue.dequeue();
            if (operation) {
                operations.push(operation);
            }
        }
        if (operations.length === 0) {
            return;
        }
        // 2. 增量差分层处理
        const optimizedOperations = this.incrementalLayer.mergeOperations(operations);
        // 3. 批量提交层处理
        const processedOperations = await this.batchLayer.processBatch(optimizedOperations);
        // 4. 处理结果
        processedOperations.forEach(operation => {
            this.handleOperationResult(operation);
        });
        // 继续处理队列
        if (!this.syncQueue.isEmpty()) {
            queueMicrotask(() => this.processSyncQueue());
        }
    }
    // 处理操作结果
    handleOperationResult(operation) {
        if (operation.status === SyncTypes_1.SyncStatus.COMPLETED) {
            // 操作完成，记录版本
            this.versionManager.recordVersion(operation.version, operation.data, operation.id);
            // 从缓存中移除
            this.optimisticLayer.removeOperation(operation.id);
            // 触发完成事件
            this.emitEvent({
                type: operation.type,
                source: operation.source,
                timestamp: Date.now(),
                data: operation.data
            });
        }
        else if (operation.status === SyncTypes_1.SyncStatus.FAILED) {
            // 操作失败，记录错误
            console.error('[RealTimeSyncManager] 操作失败:', operation);
            // 触发失败事件
            this.emitEvent({
                type: operation.type,
                source: operation.source,
                timestamp: Date.now(),
                data: {
                    ...operation.data,
                    error: 'Sync failed'
                }
            });
        }
    }
    // 创建同步操作
    createSyncOperation(options) {
        const id = `op-${++this.operationIdCounter}-${Date.now()}`;
        const version = this.versionManager.getNextVersion();
        return {
            id,
            type: options.type,
            source: options.source,
            timestamp: Date.now(),
            version,
            data: options.data,
            status: SyncTypes_1.SyncStatus.PENDING,
            retryCount: 0
        };
    }
    // 获取操作优先级
    getOperationPriority(operation) {
        switch (operation.type) {
            case SyncTypes_1.SyncOperationType.HEADER_CHANGE:
                return 3;
            case SyncTypes_1.SyncOperationType.FORM_CHANGE:
            case SyncTypes_1.SyncOperationType.EDITOR_CHANGE:
                return 2;
            case SyncTypes_1.SyncOperationType.CURSOR_CHANGE:
                return 1;
            default:
                return 0;
        }
    }
    // 选择同步策略
    selectSyncStrategy(operation) {
        for (const strategy of this.syncStrategies) {
            if (strategy.canHandle(operation)) {
                return strategy;
            }
        }
        return null;
    }
    // 添加事件监听器
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(listener);
    }
    // 移除事件监听器
    off(event, listener) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event) || [];
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    // 触发事件
    emitEvent(event) {
        const listeners = this.eventListeners.get(event.type) || [];
        listeners.forEach(listener => {
            try {
                listener(event);
            }
            catch (error) {
                console.error('[RealTimeSyncManager] 触发事件时出错:', error);
            }
        });
    }
    // 获取同步状态
    getSyncStatus() {
        return {
            queueSize: this.syncQueue.size(),
            isProcessing: this.isProcessing,
            currentVersion: this.versionManager.getCurrentVersion()
        };
    }
    // 重置同步管理器
    reset() {
        this.syncQueue.clear();
        this.optimisticLayer.clearCache();
        this.stateManager.clearState();
        this.versionManager.clearHistory();
        this.isProcessing = false;
        console.log('[RealTimeSyncManager] 已重置');
    }
    // 更新配置
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        console.log('[RealTimeSyncManager] 配置已更新:', this.config);
    }
}
exports.RealTimeSyncManager = RealTimeSyncManager;
//# sourceMappingURL=RealTimeSyncManager.js.map