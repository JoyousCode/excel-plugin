"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
// 状态管理工具
class StateManager {
    state = new Map();
    listeners = new Map();
    // 设置状态
    setState(key, value) {
        const oldValue = this.state.get(key);
        this.state.set(key, value);
        // 通知监听器
        this.notifyListeners(key, value, oldValue);
    }
    // 获取状态
    getState(key) {
        return this.state.get(key);
    }
    // 检查状态是否存在
    hasState(key) {
        return this.state.has(key);
    }
    // 删除状态
    deleteState(key) {
        const oldValue = this.state.get(key);
        this.state.delete(key);
        // 通知监听器
        this.notifyListeners(key, undefined, oldValue);
    }
    // 清除所有状态
    clearState() {
        this.state.clear();
        console.log('[StateManager] 清除所有状态');
    }
    // 添加状态监听器
    addListener(key, listener) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key)?.push(listener);
    }
    // 移除状态监听器
    removeListener(key, listener) {
        if (this.listeners.has(key)) {
            const listeners = this.listeners.get(key) || [];
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    // 通知监听器
    notifyListeners(key, newValue, oldValue) {
        if (this.listeners.has(key)) {
            const listeners = this.listeners.get(key) || [];
            listeners.forEach(listener => {
                try {
                    listener(newValue);
                }
                catch (error) {
                    console.error('[StateManager] 通知监听器时出错:', error);
                }
            });
        }
        // 通知全局监听器
        this.notifyGlobalListeners(key, newValue, oldValue);
    }
    // 通知全局监听器
    notifyGlobalListeners(key, newValue, oldValue) {
        if (this.listeners.has('*')) {
            const listeners = this.listeners.get('*') || [];
            listeners.forEach(listener => {
                try {
                    listener({ key, newValue, oldValue });
                }
                catch (error) {
                    console.error('[StateManager] 通知全局监听器时出错:', error);
                }
            });
        }
    }
    // 获取所有状态键
    getStateKeys() {
        return Array.from(this.state.keys());
    }
    // 获取状态大小
    getStateSize() {
        return this.state.size;
    }
    // 批量设置状态
    batchSetState(stateMap) {
        const changes = [];
        if (stateMap instanceof Map) {
            stateMap.forEach((value, key) => {
                const oldValue = this.state.get(key);
                this.state.set(key, value);
                changes.push({ key, newValue: value, oldValue: oldValue });
            });
        }
        else {
            Object.keys(stateMap).forEach(key => {
                const value = stateMap[key];
                const oldValue = this.state.get(key);
                this.state.set(key, value);
                changes.push({ key, newValue: value, oldValue: oldValue });
            });
        }
        // 批量通知监听器
        changes.forEach(change => {
            this.notifyListeners(change.key, change.newValue, change.oldValue);
        });
    }
}
exports.StateManager = StateManager;
//# sourceMappingURL=StateManager.js.map