"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditStateManager = void 0;
const DebounceUtils_1 = require("./utils/DebounceUtils");
class EditStateManager {
    isEditing = false;
    editStartTime = 0;
    DEBOUNCE_DELAY = 200;
    editTimeoutKey = 'editState';
    startEditing() {
        if (!this.isEditing) {
            this.isEditing = true;
            this.editStartTime = Date.now();
            console.log('[EditStateManager] 开始编辑');
        }
    }
    endEditing() {
        if (this.isEditing) {
            DebounceUtils_1.DebounceUtils.debounce(this.editTimeoutKey, () => {
                this.isEditing = false;
                this.editStartTime = 0;
                console.log('[EditStateManager] 结束编辑');
            }, this.DEBOUNCE_DELAY);
        }
    }
    forceEndEditing() {
        DebounceUtils_1.DebounceUtils.clear(this.editTimeoutKey);
        this.isEditing = false;
        this.editStartTime = 0;
        console.log('[EditStateManager] 强制结束编辑');
    }
    isCurrentlyEditing() {
        return this.isEditing;
    }
    getEditDuration() {
        if (!this.isEditing) {
            return 0;
        }
        return Date.now() - this.editStartTime;
    }
    reset() {
        DebounceUtils_1.DebounceUtils.clear(this.editTimeoutKey);
        this.isEditing = false;
        this.editStartTime = 0;
        console.log('[EditStateManager] 重置编辑状态');
    }
}
exports.EditStateManager = EditStateManager;
//# sourceMappingURL=EditStateManager.js.map