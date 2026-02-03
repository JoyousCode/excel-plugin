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
exports.SyncConfig = void 0;
const vscode = __importStar(require("vscode"));
class SyncConfig {
    static CONFIG_SECTION = 'excelPlugin.sync';
    config;
    constructor() {
        this.config = this.loadConfig();
    }
    loadConfig() {
        const config = vscode.workspace.getConfiguration(SyncConfig.CONFIG_SECTION);
        return {
            headerToForm: config.get('headerToForm', true),
            editorToFormLessThan: config.get('editorToForm.lessThan', true),
            editorToFormEqual: config.get('editorToForm.equal', true),
            editorToFormGreaterThan: config.get('editorToForm.greaterThan', true),
            formToHeader: config.get('formToHeader', true),
            currentRowInputToCursor: config.get('currentRowInputToCursor', true)
        };
    }
    refresh() {
        this.config = this.loadConfig();
    }
    get headerToForm() {
        return this.config.headerToForm;
    }
    get editorToFormLessThan() {
        return this.config.editorToFormLessThan;
    }
    get editorToFormEqual() {
        return this.config.editorToFormEqual;
    }
    get editorToFormGreaterThan() {
        return this.config.editorToFormGreaterThan;
    }
    get formToHeader() {
        return this.config.formToHeader;
    }
    get currentRowInputToCursor() {
        return this.config.currentRowInputToCursor;
    }
    getEditorToFormSyncEnabled(comparison) {
        switch (comparison) {
            case -1:
                return this.config.editorToFormLessThan;
            case 0:
                return this.config.editorToFormEqual;
            case 1:
                return this.config.editorToFormGreaterThan;
            default:
                return false;
        }
    }
}
exports.SyncConfig = SyncConfig;
//# sourceMappingURL=SyncConfig.js.map