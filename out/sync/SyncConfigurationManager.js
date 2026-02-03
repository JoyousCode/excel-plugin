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
exports.SyncConfigurationManager = void 0;
const vscode = __importStar(require("vscode"));
class SyncConfigurationManager {
    configs;
    constructor() {
        this.configs = {
            sync1: {
                enabled: true
            },
            sync2: {
                enabled: true,
                cursorToCurrentRowEnabled: true,
                currentRowToCursorEnabled: true
            },
            sync3: {
                enabled: true,
                editorToFormEnabled: true,
                formToEditorEnabled: true
            },
            sync4: {
                enabled: true,
                editorToFormEnabled: true,
                formToEditorEnabled: true
            },
            sync5: {
                enabled: true,
                editorToFormEnabled: true,
                formToEditorEnabled: true
            },
            sync6: {
                enabled: true
            }
        };
    }
    refresh() {
        const config = vscode.workspace.getConfiguration('excelPlugin');
        this.configs.sync1.enabled = config.get('sync1.enabled', true);
        this.configs.sync2.enabled = config.get('sync2.enabled', true);
        this.configs.sync2.cursorToCurrentRowEnabled = config.get('sync2.cursorToCurrentRowEnabled', true);
        this.configs.sync2.currentRowToCursorEnabled = config.get('sync2.currentRowToCursorEnabled', true);
        this.configs.sync3.enabled = config.get('sync3.enabled', true);
        this.configs.sync3.editorToFormEnabled = config.get('sync3.editorToFormEnabled', true);
        this.configs.sync3.formToEditorEnabled = config.get('sync3.formToEditorEnabled', true);
        this.configs.sync4.enabled = config.get('sync4.enabled', true);
        this.configs.sync4.editorToFormEnabled = config.get('sync4.editorToFormEnabled', true);
        this.configs.sync4.formToEditorEnabled = config.get('sync4.formToEditorEnabled', true);
        this.configs.sync5.enabled = config.get('sync5.enabled', true);
        this.configs.sync5.editorToFormEnabled = config.get('sync5.editorToFormEnabled', true);
        this.configs.sync5.formToEditorEnabled = config.get('sync5.formToEditorEnabled', true);
        this.configs.sync6.enabled = config.get('sync6.enabled', true);
    }
    getSync1Config() {
        return this.configs.sync1;
    }
    getSync2Config() {
        return this.configs.sync2;
    }
    getSync3Config() {
        return this.configs.sync3;
    }
    getSync4Config() {
        return this.configs.sync4;
    }
    getSync5Config() {
        return this.configs.sync5;
    }
    getSync6Config() {
        return this.configs.sync6;
    }
    getAllConfigs() {
        return this.configs;
    }
}
exports.SyncConfigurationManager = SyncConfigurationManager;
//# sourceMappingURL=SyncConfigurationManager.js.map