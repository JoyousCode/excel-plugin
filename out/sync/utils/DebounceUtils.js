"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebounceUtils = void 0;
class DebounceUtils {
    static timers = new Map();
    static debounce(key, func, delay) {
        try {
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
            }
            const timer = setTimeout(() => {
                try {
                    func();
                }
                catch (error) {
                    console.error(`[DebounceUtils] 执行防抖函数错误 [${key}]:`, error);
                }
                finally {
                    this.timers.delete(key);
                }
            }, delay);
            this.timers.set(key, timer);
        }
        catch (error) {
            console.error(`[DebounceUtils] 设置防抖定时器错误 [${key}]:`, error);
        }
    }
    static clear(key) {
        try {
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
                this.timers.delete(key);
            }
        }
        catch (error) {
            console.error(`[DebounceUtils] 清除防抖定时器错误 [${key}]:`, error);
        }
    }
    static clearAll() {
        try {
            this.timers.forEach(timer => clearTimeout(timer));
            this.timers.clear();
        }
        catch (error) {
            console.error('[DebounceUtils] 清除所有防抖定时器错误:', error);
        }
    }
}
exports.DebounceUtils = DebounceUtils;
//# sourceMappingURL=DebounceUtils.js.map