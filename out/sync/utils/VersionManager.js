"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionManager = void 0;
// 版本管理工具
class VersionManager {
    currentVersion = 0;
    versionHistory = new Map();
    operationHistory = new Map();
    // 获取下一个版本号
    getNextVersion() {
        this.currentVersion++;
        return this.currentVersion;
    }
    // 获取当前版本号
    getCurrentVersion() {
        return this.currentVersion;
    }
    // 记录版本快照
    recordVersion(version, data, operationId) {
        this.versionHistory.set(version, data);
        this.operationHistory.set(version, operationId);
        // 限制历史记录大小
        this.trimHistory();
    }
    // 获取版本快照
    getVersionSnapshot(version) {
        return this.versionHistory.get(version);
    }
    // 获取操作历史
    getOperationHistory(version) {
        return this.operationHistory.get(version);
    }
    // 比较版本
    compareVersions(version1, version2) {
        if (version1 > version2) {
            return 1;
        }
        else if (version1 < version2) {
            return -1;
        }
        else {
            return 0;
        }
    }
    // 解决版本冲突
    resolveConflict(localVersion, remoteVersion, localData, remoteData) {
        if (localVersion > remoteVersion) {
            // 本地版本更新，使用本地数据
            console.log('[VersionManager] 本地版本更新，使用本地数据');
            return localData;
        }
        else if (remoteVersion > localVersion) {
            // 远程版本更新，使用远程数据
            console.log('[VersionManager] 远程版本更新，使用远程数据');
            return remoteData;
        }
        else {
            // 版本相同，使用本地数据
            console.log('[VersionManager] 版本相同，使用本地数据');
            return localData;
        }
    }
    // 回滚到指定版本
    rollbackToVersion(version) {
        const snapshot = this.versionHistory.get(version);
        if (snapshot) {
            this.currentVersion = version;
            console.log(`[VersionManager] 回滚到版本 ${version}`);
            return snapshot;
        }
        console.error(`[VersionManager] 版本 ${version} 不存在`);
        return null;
    }
    // 清理历史记录
    trimHistory() {
        const maxHistorySize = 100;
        if (this.versionHistory.size > maxHistorySize) {
            const versions = Array.from(this.versionHistory.keys()).sort((a, b) => a - b);
            const versionsToRemove = versions.slice(0, this.versionHistory.size - maxHistorySize);
            versionsToRemove.forEach(version => {
                this.versionHistory.delete(version);
                this.operationHistory.delete(version);
            });
            console.log(`[VersionManager] 清理历史记录，保留 ${maxHistorySize} 个版本`);
        }
    }
    // 清除所有历史记录
    clearHistory() {
        this.versionHistory.clear();
        this.operationHistory.clear();
        this.currentVersion = 0;
        console.log('[VersionManager] 清除所有历史记录');
    }
}
exports.VersionManager = VersionManager;
//# sourceMappingURL=VersionManager.js.map