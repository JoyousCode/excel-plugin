"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RowSyncStateManager = void 0;
class RowSyncStateManager {
    _currentRowInputValue;
    _isUpdatingFromExtension;
    _debounceTimer;
    _debounceDelay;
    constructor() {
        this._currentRowInputValue = 1;
        this._isUpdatingFromExtension = false;
        this._debounceDelay = 50;
        this._debounceTimer = null;
    }
    getCurrentRowInputValue() {
        return this._currentRowInputValue;
    }
    setCurrentRowInputValue(value) {
        this._currentRowInputValue = value;
    }
    isUpdatingFromExtension() {
        return this._isUpdatingFromExtension;
    }
    setUpdatingFromExtension(value) {
        this._isUpdatingFromExtension = value;
    }
    debouncedUpdate(callback) {
        try {
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
            }
            this._debounceTimer = setTimeout(() => {
                try {
                    callback();
                }
                catch (error) {
                    console.error('[RowSyncStateManager] debouncedUpdate 回调错误:', error);
                }
            }, this._debounceDelay);
        }
        catch (error) {
            console.error('[RowSyncStateManager] debouncedUpdate 错误:', error);
        }
    }
    reset() {
        this._currentRowInputValue = 1;
        this._isUpdatingFromExtension = false;
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }
    }
    dispose() {
        this.reset();
    }
}
exports.RowSyncStateManager = RowSyncStateManager;
//# sourceMappingURL=RowSyncStateManager.js.map