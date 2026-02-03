"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderToFormSyncHandler = void 0;
const BaseSyncHandler_1 = require("../core/BaseSyncHandler");
class HeaderToFormSyncHandler extends BaseSyncHandler_1.BaseSyncHandler {
    constructor(options) {
        super(options);
    }
    canHandle(event) {
        return event.type === 'headerChange';
    }
    handle(event) {
        if (!this.shouldProcessEvent(event)) {
            return;
        }
        const headerEvent = event;
        this.log('处理表首行变更事件', {
            headers: headerEvent.headers,
            headerRowIndex: headerEvent.headerRowIndex
        });
        try {
            this.sidebarProvider.updateHeaders(headerEvent.headers);
            this.log('表单表头已更新');
        }
        catch (error) {
            this.logError('更新表单表头失败', error);
        }
    }
}
exports.HeaderToFormSyncHandler = HeaderToFormSyncHandler;
//# sourceMappingURL=HeaderToFormSyncHandler.js.map