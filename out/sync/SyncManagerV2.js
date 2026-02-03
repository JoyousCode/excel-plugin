"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncManagerV2 = void 0;
const SyncCoordinator_1 = require("./core/SyncCoordinator");
const HeaderToFormSyncHandler_1 = require("./handlers/HeaderToFormSyncHandler");
const CursorRowToCurrentRowInputSyncHandler_1 = require("./handlers/CursorRowToCurrentRowInputSyncHandler");
const CurrentRowInputToCursorSyncHandler_1 = require("./handlers/CurrentRowInputToCursorSyncHandler");
const EditorToFormSyncHandler_LessThan_1 = require("./handlers/EditorToFormSyncHandler_LessThan");
const EditorToFormSyncHandler_Equal_1 = require("./handlers/EditorToFormSyncHandler_Equal");
const EditorToFormSyncHandler_GreaterThan_1 = require("./handlers/EditorToFormSyncHandler_GreaterThan");
const FormToHeaderSyncHandler_1 = require("./handlers/FormToHeaderSyncHandler");
const SyncConfigManager_1 = require("./SyncConfigManager");
class SyncManagerV2 {
    coordinator;
    configManager;
    sidebarProvider;
    constructor(sidebarProvider) {
        this.sidebarProvider = sidebarProvider;
        this.coordinator = new SyncCoordinator_1.SyncCoordinator();
        this.configManager = new SyncConfigManager_1.SyncConfigManager();
        this.registerHandlers();
    }
    registerHandlers() {
        const config = this.configManager.getConfig();
        const handlerOptions = {
            sidebarProvider: this.sidebarProvider,
            config: { enabled: true, priority: 10, debounceMs: 50 }
        };
        this.coordinator.registerHandler(new HeaderToFormSyncHandler_1.HeaderToFormSyncHandler({
            ...handlerOptions,
            config: {
                ...handlerOptions.config,
                enabled: config.headerToForm
            }
        }));
        this.coordinator.registerHandler(new CursorRowToCurrentRowInputSyncHandler_1.CursorRowToCurrentRowInputSyncHandler({
            ...handlerOptions,
            config: {
                ...handlerOptions.config,
                enabled: config.cursorRowToCurrentRowInput
            }
        }));
        this.coordinator.registerHandler(new CurrentRowInputToCursorSyncHandler_1.CurrentRowInputToCursorSyncHandler({
            ...handlerOptions,
            config: {
                ...handlerOptions.config,
                enabled: config.currentRowInputToCursor
            }
        }));
        this.coordinator.registerHandler(new EditorToFormSyncHandler_LessThan_1.EditorToFormSyncHandler_LessThan({
            ...handlerOptions,
            config: {
                ...handlerOptions.config,
                enabled: config.editorToFormLessThan
            }
        }));
        this.coordinator.registerHandler(new EditorToFormSyncHandler_Equal_1.EditorToFormSyncHandler_Equal({
            ...handlerOptions,
            config: {
                ...handlerOptions.config,
                enabled: config.editorToFormEqual
            }
        }));
        this.coordinator.registerHandler(new EditorToFormSyncHandler_GreaterThan_1.EditorToFormSyncHandler_GreaterThan({
            ...handlerOptions,
            config: {
                ...handlerOptions.config,
                enabled: config.editorToFormGreaterThan
            }
        }));
        this.coordinator.registerHandler(new FormToHeaderSyncHandler_1.FormToHeaderSyncHandler({
            ...handlerOptions,
            config: {
                ...handlerOptions.config,
                enabled: config.formToHeader
            }
        }));
    }
    async emit(event) {
        await this.coordinator.emit(event);
    }
    refreshConfig() {
        this.configManager.refresh();
        const config = this.configManager.getConfig();
        const handlers = this.coordinator.getAllHandlers();
        const handlerConfigs = {
            'HeaderToFormSyncHandler': config.headerToForm,
            'CursorRowToCurrentRowInputSyncHandler': config.cursorRowToCurrentRowInput,
            'CurrentRowInputToCursorSyncHandler': config.currentRowInputToCursor,
            'EditorToFormSyncHandler_LessThan': config.editorToFormLessThan,
            'EditorToFormSyncHandler_Equal': config.editorToFormEqual,
            'EditorToFormSyncHandler_GreaterThan': config.editorToFormGreaterThan,
            'FormToHeaderSyncHandler': config.formToHeader
        };
        handlers.forEach(handler => {
            const enabled = handlerConfigs[handler.name] || false;
            handler.enabled = enabled;
        });
    }
    getCoordinator() {
        return this.coordinator;
    }
    dispose() {
        this.coordinator.dispose();
    }
}
exports.SyncManagerV2 = SyncManagerV2;
//# sourceMappingURL=SyncManagerV2.js.map