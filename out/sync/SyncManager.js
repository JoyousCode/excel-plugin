"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncManager = void 0;
const SyncConfig_1 = require("./SyncConfig");
const EditStateManager_1 = require("./EditStateManager");
const RowSyncConfig_1 = require("./RowSyncConfig");
const RowSyncStateManager_1 = require("./RowSyncStateManager");
const RowComparator_1 = require("./utils/RowComparator");
const HeaderToFormSyncHandler_1 = require("./handlers/HeaderToFormSyncHandler");
const EditorToFormSyncHandler_LessThan_1 = require("./handlers/EditorToFormSyncHandler_LessThan");
const EditorToFormSyncHandler_Equal_1 = require("./handlers/EditorToFormSyncHandler_Equal");
const EditorToFormSyncHandler_GreaterThan_1 = require("./handlers/EditorToFormSyncHandler_GreaterThan");
const FormToHeaderSyncHandler_1 = require("./handlers/FormToHeaderSyncHandler");
const CurrentRowInputToFormSyncHandler_1 = require("./handlers/CurrentRowInputToFormSyncHandler");
const CursorRowToCurrentRowInputSyncHandler_1 = require("./handlers/CursorRowToCurrentRowInputSyncHandler");
const CurrentRowInputToCursorSyncHandler_1 = require("./handlers/CurrentRowInputToCursorSyncHandler");
class SyncManager {
    config;
    editStateManager;
    rowSyncConfig;
    rowSyncStateManager;
    constructor() {
        this.config = new SyncConfig_1.SyncConfig();
        this.editStateManager = new EditStateManager_1.EditStateManager();
        this.rowSyncConfig = new RowSyncConfig_1.RowSyncConfig();
        this.rowSyncStateManager = new RowSyncStateManager_1.RowSyncStateManager();
    }
    refreshConfig() {
        this.config.refresh();
        this.rowSyncConfig.refresh();
    }
    getEditStateManager() {
        return this.editStateManager;
    }
    getRowSyncStateManager() {
        return this.rowSyncStateManager;
    }
    handleHeaderChange(context) {
        if (!this.config.headerToForm) {
            return;
        }
        const syncContext = {
            sidebarProvider: context.sidebarProvider,
            editor: context.editor,
            headerRowIndex: context.headerRowIndex
        };
        HeaderToFormSyncHandler_1.HeaderToFormSyncHandler.handle(syncContext);
    }
    handleEditorChange(context) {
        if (!context.editor) {
            return;
        }
        const comparison = RowComparator_1.RowComparator.compare(context.headerRowIndex, context.cursorRowIndex);
        if (!this.config.getEditorToFormSyncEnabled(comparison)) {
            return;
        }
        const syncContext = {
            sidebarProvider: context.sidebarProvider,
            editor: context.editor,
            headers: context.headers,
            headerRowIndex: context.headerRowIndex,
            cursorRowIndex: context.cursorRowIndex,
            isEditingForm: context.isEditingForm,
            isEditorChangeFromExtension: context.isEditorChangeFromExtension
        };
        switch (comparison) {
            case RowComparator_1.RowComparison.LESS_THAN:
                EditorToFormSyncHandler_LessThan_1.EditorToFormSyncHandler_LessThan.handleEditorToForm(syncContext);
                break;
            case RowComparator_1.RowComparison.EQUAL:
                EditorToFormSyncHandler_Equal_1.EditorToFormSyncHandler_Equal.handleEditorToForm(syncContext);
                break;
            case RowComparator_1.RowComparison.GREATER_THAN:
                EditorToFormSyncHandler_GreaterThan_1.EditorToFormSyncHandler_GreaterThan.handleEditorToForm(syncContext);
                break;
        }
    }
    handleFormChange(context) {
        if (!context.editor) {
            return;
        }
        const comparison = RowComparator_1.RowComparator.compare(context.headerRowIndex, context.cursorRowIndex);
        const syncContext = {
            sidebarProvider: context.sidebarProvider,
            editor: context.editor,
            headers: context.headers,
            headerRowIndex: context.headerRowIndex,
            cursorRowIndex: context.cursorRowIndex,
            isEditingForm: context.isEditingForm,
            isEditorChangeFromExtension: context.isEditorChangeFromExtension
        };
        switch (comparison) {
            case RowComparator_1.RowComparison.LESS_THAN:
                if (this.config.editorToFormLessThan) {
                    EditorToFormSyncHandler_LessThan_1.EditorToFormSyncHandler_LessThan.handleFormToEditor({ ...syncContext, ...context });
                }
                break;
            case RowComparator_1.RowComparison.EQUAL:
                if (this.config.editorToFormEqual) {
                    EditorToFormSyncHandler_Equal_1.EditorToFormSyncHandler_Equal.handleFormToEditor({ ...syncContext, ...context });
                }
                break;
            case RowComparator_1.RowComparison.GREATER_THAN:
                if (this.config.editorToFormGreaterThan) {
                    EditorToFormSyncHandler_GreaterThan_1.EditorToFormSyncHandler_GreaterThan.handleFormToEditor({ ...syncContext, ...context });
                }
                break;
        }
        if (this.config.formToHeader && comparison === RowComparator_1.RowComparison.EQUAL) {
            const formToHeaderContext = {
                sidebarProvider: context.sidebarProvider,
                editor: context.editor,
                headers: context.headers,
                headerRowIndex: context.headerRowIndex,
                cursorRowIndex: context.cursorRowIndex
            };
            FormToHeaderSyncHandler_1.FormToHeaderSyncHandler.handle({ ...formToHeaderContext, column: context.column, value: context.value });
        }
    }
    handleCurrentRowInputChange(context) {
        if (!this.rowSyncConfig.currentRowInputToForm) {
            return;
        }
        const syncContext = {
            sidebarProvider: context.sidebarProvider,
            editor: context.editor,
            headers: context.headers,
            headerRowIndex: context.headerRowIndex,
            currentRowInputValue: context.currentRowValue,
            isUpdatingFromExtension: this.rowSyncStateManager.isUpdatingFromExtension()
        };
        CurrentRowInputToFormSyncHandler_1.CurrentRowInputToFormSyncHandler.handle(syncContext);
    }
    handleCursorRowChange(context) {
        if (!this.rowSyncConfig.cursorRowToCurrentRowInput) {
            return;
        }
        const syncContext = {
            sidebarProvider: context.sidebarProvider,
            editor: context.editor,
            cursorRowIndex: context.cursorRowIndex,
            isEditingForm: context.isEditingForm
        };
        CursorRowToCurrentRowInputSyncHandler_1.CursorRowToCurrentRowInputSyncHandler.handle(syncContext);
    }
    handleCurrentRowInputToCursorChange(context) {
        if (!this.config.currentRowInputToCursor) {
            return;
        }
        const syncContext = {
            sidebarProvider: context.sidebarProvider,
            editor: context.editor,
            currentRowValue: context.currentRowValue,
            isUpdatingFromExtension: this.rowSyncStateManager.isUpdatingFromExtension()
        };
        CurrentRowInputToCursorSyncHandler_1.CurrentRowInputToCursorSyncHandler.handle(syncContext);
    }
    clearAllSyncs() {
        HeaderToFormSyncHandler_1.HeaderToFormSyncHandler.clear();
        EditorToFormSyncHandler_LessThan_1.EditorToFormSyncHandler_LessThan.clear();
        EditorToFormSyncHandler_Equal_1.EditorToFormSyncHandler_Equal.clear();
        EditorToFormSyncHandler_GreaterThan_1.EditorToFormSyncHandler_GreaterThan.clear();
        FormToHeaderSyncHandler_1.FormToHeaderSyncHandler.clear();
        CurrentRowInputToFormSyncHandler_1.CurrentRowInputToFormSyncHandler.clear();
        CursorRowToCurrentRowInputSyncHandler_1.CursorRowToCurrentRowInputSyncHandler.clear();
        CurrentRowInputToCursorSyncHandler_1.CurrentRowInputToCursorSyncHandler.clear();
        this.editStateManager.reset();
        this.rowSyncStateManager.reset();
    }
    dispose() {
        this.clearAllSyncs();
    }
}
exports.SyncManager = SyncManager;
//# sourceMappingURL=SyncManager.js.map