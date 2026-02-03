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
exports.SyncConfigManager = void 0;
const vscode = __importStar(require("vscode"));
class SyncConfigManager {
    static CONFIG_SECTION = 'excelPlugin.sync';
    config;
    constructor() {
        this.config = this.loadConfig();
    }
    loadConfig() {
        const config = vscode.workspace.getConfiguration(SyncConfigManager.CONFIG_SECTION);
        return {
            headerToForm: config.get('headerToForm', true),
            cursorRowToCurrentRowInput: config.get('cursorRowToCurrentRowInput', true),
            currentRowInputToCursor: config.get('currentRowInputToCursor', true),
            editorToFormLessThan: config.get('editorToForm.lessThan', true),
            editorToFormEqual: config.get('editorToForm.equal', true),
            editorToFormGreaterThan: config.get('editorToForm.greaterThan', true),
            formToHeader: config.get('formToHeader', true)
        };
    }
    refresh() {
        this.config = this.loadConfig();
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        const config = vscode.workspace.getConfiguration(SyncConfigManager.CONFIG_SECTION);
        if (updates.headerToForm !== undefined) {
            config.update('headerToForm', updates.headerToForm, vscode.ConfigurationTarget.Global);
        }
        if (updates.cursorRowToCurrentRowInput !== undefined) {
            config.update('cursorRowToCurrentRowInput', updates.cursorRowToCurrentRowInput, vscode.ConfigurationTarget.Global);
        }
        if (updates.currentRowInputToCursor !== undefined) {
            config.update('currentRowInputToCursor', updates.currentRowInputToCursor, vscode.ConfigurationTarget.Global);
        }
        if (updates.editorToFormLessThan !== undefined) {
            config.update('editorToForm.lessThan', updates.editorToFormLessThan, vscode.ConfigurationTarget.Global);
        }
        if (updates.editorToFormEqual !== undefined) {
            config.update('editorToForm.equal', updates.editorToFormEqual, vscode.ConfigurationTarget.Global);
        }
        if (updates.editorToFormGreaterThan !== undefined) {
            config.update('editorToForm.greaterThan', updates.editorToFormGreaterThan, vscode.ConfigurationTarget.Global);
        }
        if (updates.formToHeader !== undefined) {
            config.update('formToHeader', updates.formToHeader, vscode.ConfigurationTarget.Global);
        }
    }
}
exports.SyncConfigManager = SyncConfigManager;
//# sourceMappingURL=SyncConfigManager.js.map