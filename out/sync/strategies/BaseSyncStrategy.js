"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSyncStrategy = void 0;
// 基础同步策略
class BaseSyncStrategy {
    name;
    constructor(name) {
        this.name = name;
    }
    // 获取策略名称
    getName() {
        return this.name;
    }
    // 验证操作数据
    validateOperation(operation) {
        if (!operation || !operation.id || !operation.type || !operation.source) {
            console.error('[BaseSyncStrategy] 无效的操作数据:', operation);
            return false;
        }
        return true;
    }
    // 处理同步错误
    handleError(error, operation) {
        console.error(`[BaseSyncStrategy] 执行策略 ${this.name} 时出错:`, error);
        console.error('[BaseSyncStrategy] 操作数据:', operation);
    }
}
exports.BaseSyncStrategy = BaseSyncStrategy;
//# sourceMappingURL=BaseSyncStrategy.js.map