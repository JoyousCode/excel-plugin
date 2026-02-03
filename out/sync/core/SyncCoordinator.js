"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncCoordinator = void 0;
const vscode = __importStar(require("vscode"));
class SyncCoordinator {
    handlers = new Map();
    eventQueue = [];
    isProcessing = false;
    disposables = [];
    constructor() {
        this.setupEventQueueProcessor();
    }
    registerHandler(handler) {
        if (this.handlers.has(handler.name)) {
            console.warn(`[SyncCoordinator] 处理器 ${handler.name} 已存在，将被覆盖`);
        }
        this.handlers.set(handler.name, handler);
        console.log(`[SyncCoordinator] 注册处理器: ${handler.name}`);
    }
    unregisterHandler(handlerName) {
        const handler = this.handlers.get(handlerName);
        if (handler) {
            handler.dispose();
            this.handlers.delete(handlerName);
            console.log(`[SyncCoordinator] 注销处理器: ${handlerName}`);
        }
    }
    async emit(event) {
        console.log(`[SyncCoordinator] 接收事件: ${event.type}`, event);
        this.eventQueue.push(event);
        if (!this.isProcessing) {
            await this.processEventQueue();
        }
    }
    async processEventQueue() {
        if (this.isProcessing || this.eventQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                if (event) {
                    await this.processEvent(event);
                }
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    async processEvent(event) {
        const eligibleHandlers = Array.from(this.handlers.values())
            .filter(handler => handler.enabled && handler.canHandle(event))
            .sort((a, b) => {
            const priorityA = a.config?.priority || 0;
            const priorityB = b.config?.priority || 0;
            return priorityB - priorityA;
        });
        console.log(`[SyncCoordinator] 事件 ${event.type} 的处理器:`, eligibleHandlers.map(h => h.name));
        for (const handler of eligibleHandlers) {
            try {
                console.log(`[SyncCoordinator] 执行处理器: ${handler.name}`);
                await handler.handle(event);
            }
            catch (error) {
                console.error(`[SyncCoordinator] 处理器 ${handler.name} 执行失败:`, error);
            }
        }
    }
    setupEventQueueProcessor() {
        const interval = setInterval(() => {
            if (this.eventQueue.length > 0 && !this.isProcessing) {
                this.processEventQueue().catch(error => {
                    console.error('[SyncCoordinator] 处理事件队列失败:', error);
                });
            }
        }, 10);
        this.disposables.push(new vscode.Disposable(() => {
            clearInterval(interval);
        }));
    }
    getHandler(handlerName) {
        return this.handlers.get(handlerName);
    }
    getAllHandlers() {
        return Array.from(this.handlers.values());
    }
    dispose() {
        this.handlers.forEach(handler => handler.dispose());
        this.handlers.clear();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.eventQueue = [];
    }
}
exports.SyncCoordinator = SyncCoordinator;
//# sourceMappingURL=SyncCoordinator.js.map