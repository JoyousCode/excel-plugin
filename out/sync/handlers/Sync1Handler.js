"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sync1Handler = void 0;
class Sync1Handler {
    static debounceTimer = null;
    static DEBOUNCE_MS = 50;
    static handle(context) {
        if (Sync1Handler.debounceTimer) {
            clearTimeout(Sync1Handler.debounceTimer);
        }
        Sync1Handler.debounceTimer = setTimeout(() => {
            Sync1Handler.executeSync(context);
        }, Sync1Handler.DEBOUNCE_MS);
    }
    static executeSync(context) {
        try {
            const document = context.editor.document;
            const headerLine = document.lineAt(context.headerRowIndex - 1);
            const newHeaders = headerLine.text.split('\t').map(h => h.trim());
            context.headers = newHeaders;
            context.sidebarProvider.postMessage({
                type: 'updateHeaders',
                headers: newHeaders
            });
            console.log('[Sync1] 表首行已同步到表单表头:', newHeaders);
        }
        catch (error) {
            console.error('[Sync1] 同步失败:', error);
        }
    }
    static clear() {
        if (Sync1Handler.debounceTimer) {
            clearTimeout(Sync1Handler.debounceTimer);
            Sync1Handler.debounceTimer = null;
        }
    }
}
exports.Sync1Handler = Sync1Handler;
//# sourceMappingURL=Sync1Handler.js.map