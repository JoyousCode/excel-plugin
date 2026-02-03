"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncrementalLayer = void 0;
const SyncTypes_1 = require("../../types/SyncTypes");
// 增量差分层
class IncrementalLayer {
    // 智能合并操作
    mergeOperations(operations) {
        if (operations.length <= 1) {
            return operations;
        }
        // 1. 按来源和类型分组
        const groupedOperations = this.groupOperations(operations);
        // 2. 智能合并相同单元格的连续修改
        const mergedOperations = this.mergeSimilarOperations(groupedOperations);
        // 3. 计算最小变化集
        const minimalChanges = this.calculateMinimalChanges(mergedOperations);
        // 4. 按优先级排序
        const prioritizedOperations = this.prioritizeOperations(minimalChanges);
        return prioritizedOperations;
    }
    // 分组操作
    groupOperations(operations) {
        const groups = new Map();
        operations.forEach(operation => {
            const groupKey = this.getGroupKey(operation);
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey)?.push(operation);
        });
        return groups;
    }
    // 获取分组键
    getGroupKey(operation) {
        if (operation.type === SyncTypes_1.SyncOperationType.FORM_CHANGE || operation.type === SyncTypes_1.SyncOperationType.EDITOR_CHANGE) {
            if (operation.data && operation.data.column !== undefined) {
                return `${operation.source}:${operation.data.rowIndex || operation.data.cursorRowIndex}:${operation.data.column}`;
            }
        }
        return `${operation.source}:${operation.type}`;
    }
    // 合并相似操作
    mergeSimilarOperations(groupedOperations) {
        const mergedOperations = [];
        groupedOperations.forEach((group, key) => {
            if (group.length === 1) {
                mergedOperations.push(group[0]);
                return;
            }
            // 按时间戳排序，取最新的操作
            group.sort((a, b) => b.timestamp - a.timestamp);
            const latestOperation = group[0];
            // 合并相同单元格的连续修改
            if (latestOperation.type === SyncTypes_1.SyncOperationType.FORM_CHANGE || latestOperation.type === SyncTypes_1.SyncOperationType.EDITOR_CHANGE) {
                // 计算最小变化
                const firstOperation = group[group.length - 1];
                if (firstOperation.data && firstOperation.data.value !== undefined) {
                    latestOperation.data.oldValue = firstOperation.data.value;
                }
            }
            mergedOperations.push(latestOperation);
        });
        return mergedOperations;
    }
    // 计算最小变化集
    calculateMinimalChanges(operations) {
        // 移除冗余操作
        const minimalChanges = operations.filter(operation => {
            if (operation.type === SyncTypes_1.SyncOperationType.FORM_CHANGE || operation.type === SyncTypes_1.SyncOperationType.EDITOR_CHANGE) {
                // 移除值没有变化的操作
                return operation.data.value !== operation.data.oldValue;
            }
            return true;
        });
        return minimalChanges;
    }
    // 按优先级排序
    prioritizeOperations(operations) {
        // 优先级排序：表头变化 > 单元格变化 > 光标变化
        return operations.sort((a, b) => {
            const priorityMap = {
                [SyncTypes_1.SyncOperationType.HEADER_CHANGE]: 3,
                [SyncTypes_1.SyncOperationType.FORM_CHANGE]: 2,
                [SyncTypes_1.SyncOperationType.EDITOR_CHANGE]: 2,
                [SyncTypes_1.SyncOperationType.CURSOR_CHANGE]: 1
            };
            const priorityA = priorityMap[a.type] || 0;
            const priorityB = priorityMap[b.type] || 0;
            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }
            // 相同优先级按时间戳排序
            return b.timestamp - a.timestamp;
        });
    }
}
exports.IncrementalLayer = IncrementalLayer;
//# sourceMappingURL=IncrementalLayer.js.map