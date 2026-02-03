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
exports.HtmlTemplateLoader = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class HtmlTemplateLoader {
    _extensionUri;
    _templateCache = new Map();
    _options;
    constructor(extensionUri, options = {}) {
        this._extensionUri = extensionUri;
        this._options = {
            cacheSize: options.cacheSize || 100,
            enableCache: options.enableCache ?? true,
            enableLogging: options.enableLogging ?? false
        };
        this.clearCache();
    }
    loadTemplate(templateName, variables = {}) {
        if (!templateName || typeof templateName !== 'string') {
            throw new Error('Template name must be a non-empty string');
        }
        const cacheKey = this._generateCacheKey(templateName, variables);
        if (this._options.enableCache && this._templateCache.has(cacheKey)) {
            if (this._options.enableLogging) {
                console.log(`[HtmlTemplateLoader] Loading template from cache: ${templateName}`);
            }
            return this._templateCache.get(cacheKey);
        }
        try {
            const templatePath = path.join(this._extensionUri.fsPath, 'webview', templateName);
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template file not found: ${templatePath}`);
            }
            let templateContent = fs.readFileSync(templatePath, 'utf8');
            if (this._options.enableLogging) {
                console.log(`[HtmlTemplateLoader] Loading template: ${templateName}`);
            }
            templateContent = this._replaceVariables(templateContent, variables);
            if (this._options.enableCache) {
                this._ensureCacheSize();
                this._templateCache.set(cacheKey, templateContent);
            }
            return templateContent;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[HtmlTemplateLoader] Failed to load template ${templateName}: ${errorMessage}`);
            throw new Error(`Failed to load template ${templateName}: ${errorMessage}`);
        }
    }
    loadFallbackTemplate(webview) {
        if (!webview) {
            throw new Error('Webview is required');
        }
        const variables = {
            STYLE_URI: webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'sidebar.css')).toString(),
            SCRIPT_URI: webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'sidebar.js')).toString(),
            NONCE: this.generateNonce(),
            CSP_SOURCE: webview.cspSource
        };
        return this.loadTemplate('sidebar-fallback.html', variables);
    }
    loadFormTemplate() {
        try {
            const fullTemplate = this.loadTemplate('sidebar-form.html');
            // 提取表单包装器部分
            const formWrapperMatch = fullTemplate.match(/<div class="form-wrapper"[^>]*>[\s\S]*<\/div>\s*<\/body>/);
            if (formWrapperMatch) {
                // 移除最后的 </body> 标签
                return formWrapperMatch[0].replace(/\s*<\/body>$/, '');
            }
            // 如果提取失败，返回默认模板
            throw new Error('Failed to extract form wrapper from template');
        }
        catch (error) {
            console.error(`[HtmlTemplateLoader] Failed to load form template:`, error);
            return this._getDefaultFormTemplate();
        }
    }
    clearCache() {
        this._templateCache.clear();
        if (this._options.enableLogging) {
            console.log(`[HtmlTemplateLoader] Cache cleared`);
        }
    }
    generateNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    getCacheSize() {
        return this._templateCache.size;
    }
    updateOptions(options) {
        this._options = {
            ...this._options,
            ...options
        };
        if (this._options.enableCache) {
            this._ensureCacheSize();
        }
        else {
            this.clearCache();
        }
    }
    _generateCacheKey(templateName, variables) {
        // 生成更紧凑的缓存键
        const variablesHash = Object.keys(variables)
            .sort()
            .map(key => `${key}:${variables[key].length}`)
            .join('|');
        return `${templateName}:${variablesHash}`;
    }
    _replaceVariables(templateContent, variables) {
        let result = templateContent;
        for (const [key, value] of Object.entries(variables)) {
            const pattern = `{{${key}}}`;
            const regex = new RegExp(pattern.replace(/[.*+?^${}()\[\]\\]/g, '\\$&'), 'g');
            result = result.replace(regex, value);
        }
        return result;
    }
    _ensureCacheSize() {
        if (this._templateCache.size >= this._options.cacheSize) {
            // 移除最早的缓存项
            const firstKey = this._templateCache.keys().next().value;
            if (firstKey) {
                this._templateCache.delete(firstKey);
            }
        }
    }
    _getDefaultFormTemplate() {
        return `
      <div class="form-wrapper" id="formWrapper" style="display: none;">
        <div class="row-selectors-container">
          <div class="row-selector-item">
            <label for="headerRowInput">表首行:</label>
            <input type="number" id="headerRowInput" class="row-selector-input" min="1" value="1">
          </div>
          
          <div class="row-selector-item">
            <label for="currentRowInput">当前行:</label>
            <input type="number" id="currentRowInput" class="row-selector-input" min="1" value="1">
          </div>
        </div>
        
        <div class="form-container">
          <div class="form-scroll-container">
            <div id="formFields"></div>
          </div>
        </div>
      </div>
    `;
    }
}
exports.HtmlTemplateLoader = HtmlTemplateLoader;
//# sourceMappingURL=HtmlTemplateLoader.js.map