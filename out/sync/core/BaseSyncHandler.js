"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSyncHandler = void 0;
class BaseSyncHandler {
    options;
    sidebarProvider;
    config;
    disposables = [];
    lastEventTime = 0;
    debounceTimer = null;
    constructor(options) {
        this.options = options;
        this.sidebarProvider = options.sidebarProvider;
        this.config = options.config;
    }
    get name() {
        return this.constructor.name;
    }
    get enabled() {
        return this.config.enabled;
    }
    set enabled(value) {
        this.config.enabled = value;
    }
    debounce(callback) {
        const debounceMs = this.config.debounceMs || 50;
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            callback();
            this.debounceTimer = null;
        }, debounceMs);
    }
    shouldProcessEvent(event) {
        if (!this.enabled) {
            return false;
        }
        const now = Date.now();
        const timeSinceLastEvent = now - this.lastEventTime;
        if (timeSinceLastEvent < (this.config.debounceMs || 50)) {
            return false;
        }
        this.lastEventTime = now;
        return true;
    }
    log(message, data) {
        console.log(`[${this.name}] ${message}`, data || '');
    }
    logError(message, error) {
        console.error(`[${this.name}] ${message}`, error);
    }
    dispose() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.BaseSyncHandler = BaseSyncHandler;
//# sourceMappingURL=BaseSyncHandler.js.map