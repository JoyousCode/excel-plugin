"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorRowToCurrentRowInputSyncHandler = void 0;
const BaseSyncHandler_1 = require("../core/BaseSyncHandler");
class CursorRowToCurrentRowInputSyncHandler extends BaseSyncHandler_1.BaseSyncHandler {
    constructor(options) {
        super(options);
    }
    canHandle(event) {
        return event.type === 'cursorRowChange';
    }
    handle(event) {
        if (!this.shouldProcessEvent(event)) {
            return;
        }
        const cursorEvent = event;
        this.log('处理光标行变更事件', {
            cursorRowIndex: cursorEvent.cursorRowIndex
        });
        try {
            // 只更新当前行输入框的值，不重新渲染表单
            // 因为updateCurrentLineData已经调用了selectRow更新了表单数据
            this.sidebarProvider.updateCurrentRowInput(cursorEvent.cursorRowIndex);
            this.log('当前行输入框已更新');
        }
        catch (error) {
            this.logError('更新当前行输入框失败', error);
        }
    }
}
exports.CursorRowToCurrentRowInputSyncHandler = CursorRowToCurrentRowInputSyncHandler;
//# sourceMappingURL=CursorRowToCurrentRowInputSyncHandler.js.map