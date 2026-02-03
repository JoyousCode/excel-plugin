"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewSyncManager = void 0;
const SyncConfigurationManager_1 = require("./SyncConfigurationManager");
const Sync1Handler_1 = require("./handlers/Sync1Handler");
const Sync2Handler_1 = require("./handlers/Sync2Handler");
const Sync3Handler_1 = require("./handlers/Sync3Handler");
const Sync4Handler_1 = require("./handlers/Sync4Handler");
const Sync5Handler_1 = require("./handlers/Sync5Handler");
const Sync6Handler_1 = require("./handlers/Sync6Handler");
class NewSyncManager {
    configManager;
    isEditingForm = false;
    isEditorChangeFromExtension = false;
    isUpdatingFromExtension = false;
    constructor() {
        this.configManager = new SyncConfigurationManager_1.SyncConfigurationManager();
        this.configManager.refresh();
    }
    refreshConfig() {
        this.configManager.refresh();
    }
    setEditingForm(value) {
        this.isEditingForm = value;
    }
    setEditorChangeFromExtension(value) {
        this.isEditorChangeFromExtension = value;
    }
    setUpdatingFromExtension(value) {
        this.isUpdatingFromExtension = value;
    }
    handleHeaderChange(context) {
        const config = this.configManager.getSync1Config();
        if (!config.enabled) {
            return;
        }
        if (!context.editor) {
            return;
        }
        const sync1Context = {
            editor: context.editor,
            headerRowIndex: context.headerRowIndex,
            headers: context.headers,
            sidebarProvider: context.sidebarProvider
        };
        Sync1Handler_1.Sync1Handler.handle(sync1Context);
    }
    handleCursorRowChange(context) {
        const config = this.configManager.getSync2Config();
        if (!config.enabled || !config.cursorToCurrentRowEnabled) {
            return;
        }
        if (!context.editor) {
            return;
        }
        const sync2Context = {
            editor: context.editor,
            cursorRowIndex: context.cursorRowIndex,
            currentRowValue: context.cursorRowIndex,
            sidebarProvider: context.sidebarProvider,
            isUpdatingFromExtension: this.isUpdatingFromExtension
        };
        Sync2Handler_1.Sync2Handler.handleCursorToCurrentRow(sync2Context);
    }
    handleCurrentRowInputChange(context) {
        const config = this.configManager.getSync2Config();
        if (!config.enabled || !config.currentRowToCursorEnabled) {
            return;
        }
        if (!context.editor) {
            return;
        }
        const sync2Context = {
            editor: context.editor,
            cursorRowIndex: context.cursorRowIndex,
            currentRowValue: context.currentRowValue,
            sidebarProvider: context.sidebarProvider,
            isUpdatingFromExtension: this.isUpdatingFromExtension
        };
        Sync2Handler_1.Sync2Handler.handleCurrentRowToCursor(sync2Context);
    }
    handleEditorChange(context) {
        if (!context.editor) {
            return;
        }
        const comparison = this.compareRows(context.headerRowIndex, context.cursorRowIndex);
        switch (comparison) {
            case 'less':
                this.handleEditorChangeLessThan(context);
                break;
            case 'equal':
                this.handleEditorChangeEqual(context);
                break;
            case 'greater':
                this.handleEditorChangeGreaterThan(context);
                break;
        }
    }
    handleEditorChangeLessThan(context) {
        if (!context.editor) {
            return;
        }
        const config = this.configManager.getSync3Config();
        if (!config.enabled || !config.editorToFormEnabled) {
            return;
        }
        const sync3Context = {
            editor: context.editor,
            headerRowIndex: context.headerRowIndex,
            cursorRowIndex: context.cursorRowIndex,
            headers: context.headers,
            sidebarProvider: context.sidebarProvider,
            isEditingForm: this.isEditingForm,
            isEditorChangeFromExtension: this.isEditorChangeFromExtension
        };
        Sync3Handler_1.Sync3Handler.handleEditorToForm(sync3Context);
    }
    handleEditorChangeEqual(context) {
        if (!context.editor) {
            return;
        }
        const config = this.configManager.getSync4Config();
        if (!config.enabled || !config.editorToFormEnabled) {
            return;
        }
        const sync4Context = {
            editor: context.editor,
            headerRowIndex: context.headerRowIndex,
            cursorRowIndex: context.cursorRowIndex,
            headers: context.headers,
            sidebarProvider: context.sidebarProvider,
            isEditingForm: this.isEditingForm,
            isEditorChangeFromExtension: this.isEditorChangeFromExtension
        };
        Sync4Handler_1.Sync4Handler.handleEditorToForm(sync4Context);
    }
    handleEditorChangeGreaterThan(context) {
        if (!context.editor) {
            return;
        }
        const config = this.configManager.getSync5Config();
        if (!config.enabled || !config.editorToFormEnabled) {
            return;
        }
        const sync5Context = {
            editor: context.editor,
            headerRowIndex: context.headerRowIndex,
            cursorRowIndex: context.cursorRowIndex,
            headers: context.headers,
            sidebarProvider: context.sidebarProvider,
            isEditingForm: this.isEditingForm,
            isEditorChangeFromExtension: this.isEditorChangeFromExtension
        };
        Sync5Handler_1.Sync5Handler.handleEditorToForm(sync5Context);
    }
    handleFormChange(context) {
        if (!context.editor) {
            return;
        }
        const comparison = this.compareRows(context.headerRowIndex, context.cursorRowIndex);
        switch (comparison) {
            case 'less':
                this.handleFormChangeLessThan(context);
                break;
            case 'equal':
                this.handleFormChangeEqual(context);
                break;
            case 'greater':
                this.handleFormChangeGreaterThan(context);
                break;
        }
    }
    handleFormChangeLessThan(context) {
        if (!context.editor) {
            return;
        }
        const config = this.configManager.getSync3Config();
        if (!config.enabled || !config.formToEditorEnabled) {
            return;
        }
        const sync3Context = {
            editor: context.editor,
            headerRowIndex: context.headerRowIndex,
            cursorRowIndex: context.cursorRowIndex,
            headers: context.headers,
            sidebarProvider: context.sidebarProvider,
            isEditingForm: this.isEditingForm,
            isEditorChangeFromExtension: this.isEditorChangeFromExtension,
            rowIndex: context.rowIndex,
            column: context.column,
            value: context.value
        };
        Sync3Handler_1.Sync3Handler.handleFormToEditor(sync3Context);
    }
    handleFormChangeEqual(context) {
        if (!context.editor) {
            return;
        }
        const config = this.configManager.getSync4Config();
        if (!config.enabled || !config.formToEditorEnabled) {
            return;
        }
        const sync4Context = {
            editor: context.editor,
            headerRowIndex: context.headerRowIndex,
            cursorRowIndex: context.cursorRowIndex,
            headers: context.headers,
            sidebarProvider: context.sidebarProvider,
            isEditingForm: this.isEditingForm,
            isEditorChangeFromExtension: this.isEditorChangeFromExtension,
            rowIndex: context.rowIndex,
            column: context.column,
            value: context.value
        };
        Sync4Handler_1.Sync4Handler.handleFormToEditor(sync4Context);
        const sync6Config = this.configManager.getSync6Config();
        if (sync6Config.enabled) {
            const sync6Context = {
                editor: context.editor,
                headerRowIndex: context.headerRowIndex,
                cursorRowIndex: context.cursorRowIndex,
                headers: context.headers,
                sidebarProvider: context.sidebarProvider,
                column: context.column,
                value: context.value
            };
            Sync6Handler_1.Sync6Handler.handle(sync6Context);
        }
    }
    handleFormChangeGreaterThan(context) {
        if (!context.editor) {
            return;
        }
        const config = this.configManager.getSync5Config();
        if (!config.enabled || !config.formToEditorEnabled) {
            return;
        }
        const sync5Context = {
            editor: context.editor,
            headerRowIndex: context.headerRowIndex,
            cursorRowIndex: context.cursorRowIndex,
            headers: context.headers,
            sidebarProvider: context.sidebarProvider,
            isEditingForm: this.isEditingForm,
            isEditorChangeFromExtension: this.isEditorChangeFromExtension,
            rowIndex: context.rowIndex,
            column: context.column,
            value: context.value
        };
        Sync5Handler_1.Sync5Handler.handleFormToEditor(sync5Context);
    }
    compareRows(headerRowIndex, cursorRowIndex) {
        if (headerRowIndex < cursorRowIndex) {
            return 'less';
        }
        else if (headerRowIndex === cursorRowIndex) {
            return 'equal';
        }
        else {
            return 'greater';
        }
    }
    clearAllSyncs() {
        Sync1Handler_1.Sync1Handler.clear();
        Sync2Handler_1.Sync2Handler.clear();
        Sync3Handler_1.Sync3Handler.clear();
        Sync4Handler_1.Sync4Handler.clear();
        Sync5Handler_1.Sync5Handler.clear();
        Sync6Handler_1.Sync6Handler.clear();
    }
    dispose() {
        this.clearAllSyncs();
    }
}
exports.NewSyncManager = NewSyncManager;
//# sourceMappingURL=NewSyncManager.js.map