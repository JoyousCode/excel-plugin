"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncConfig = void 0;
const SyncTypes_1 = require("../types/SyncTypes");
// 同步配置类
class SyncConfig {
    enabled;
    mode;
    conflictResolution;
    batchSize;
    retryCount;
    debounceTime;
    maxConcurrent;
    constructor(config) {
        this.enabled = config?.enabled ?? true;
        this.mode = config?.mode ?? SyncTypes_1.SyncMode.REAL_TIME;
        this.conflictResolution = config?.conflictResolution ?? SyncTypes_1.ConflictResolutionStrategy.LATEST_WINS;
        this.batchSize = config?.batchSize ?? 3;
        this.retryCount = config?.retryCount ?? 3;
        this.debounceTime = config?.debounceTime ?? 0; // 零延迟
        this.maxConcurrent = config?.maxConcurrent ?? 5;
    }
    // 获取默认配置
    static getDefaultConfig() {
        return new SyncConfig();
    }
    // 从对象创建配置
    static fromObject(obj) {
        return new SyncConfig({
            enabled: obj.enabled,
            mode: obj.mode,
            conflictResolution: obj.conflictResolution,
            batchSize: obj.batchSize,
            retryCount: obj.retryCount,
            debounceTime: obj.debounceTime,
            maxConcurrent: obj.maxConcurrent
        });
    }
    // 转换为对象
    toObject() {
        return {
            enabled: this.enabled,
            mode: this.mode,
            conflictResolution: this.conflictResolution,
            batchSize: this.batchSize,
            retryCount: this.retryCount,
            debounceTime: this.debounceTime,
            maxConcurrent: this.maxConcurrent
        };
    }
    // 验证配置
    validate() {
        return (typeof this.enabled === 'boolean' &&
            Object.values(SyncTypes_1.SyncMode).includes(this.mode) &&
            Object.values(SyncTypes_1.ConflictResolutionStrategy).includes(this.conflictResolution) &&
            typeof this.batchSize === 'number' && this.batchSize > 0 &&
            typeof this.retryCount === 'number' && this.retryCount >= 0 &&
            typeof this.debounceTime === 'number' && this.debounceTime >= 0 &&
            typeof this.maxConcurrent === 'number' && this.maxConcurrent > 0);
    }
}
exports.SyncConfig = SyncConfig;
//# sourceMappingURL=SyncConfig.js.map