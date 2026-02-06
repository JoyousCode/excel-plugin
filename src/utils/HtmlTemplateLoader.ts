import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface TemplateVariables {
  [key: string]: string;
}

export interface HtmlTemplateLoaderOptions {
  cacheSize?: number;
  enableCache?: boolean;
  enableLogging?: boolean;
}

export class HtmlTemplateLoader {
  private _extensionUri: vscode.Uri;
  private _templateCache: Map<string, string> = new Map();
  private _options: Required<HtmlTemplateLoaderOptions>;

  constructor(extensionUri: vscode.Uri, options: HtmlTemplateLoaderOptions = {}) {
    this._extensionUri = extensionUri;
    this._options = {
      cacheSize: options.cacheSize || 100,
      enableCache: options.enableCache ?? true,
      enableLogging: options.enableLogging ?? false
    };
    this.clearCache();
  }

  public loadTemplate(templateName: string, variables: TemplateVariables = {}): string {
    if (!templateName || typeof templateName !== 'string') {
      throw new Error('Template name must be a non-empty string');
    }

    const cacheKey = this._generateCacheKey(templateName, variables);
    
    if (this._options.enableCache && this._templateCache.has(cacheKey)) {
      if (this._options.enableLogging) {
        console.log(`[HtmlTemplateLoader] Loading template from cache: ${templateName}`);
      }
      return this._templateCache.get(cacheKey)!;
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[HtmlTemplateLoader] Failed to load template ${templateName}: ${errorMessage}`);
      throw new Error(`Failed to load template ${templateName}: ${errorMessage}`);
    }
  }

  public loadFallbackTemplate(webview: vscode.Webview): string {
    if (!webview) {
      throw new Error('Webview is required');
    }

    const variables: TemplateVariables = {
      STYLE_URI: webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'sidebar.css')).toString(),
      SCRIPT_URI: webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview', 'sidebar.js')).toString(),
      NONCE: this.generateNonce(),
      CSP_SOURCE: webview.cspSource
    };

    return this.loadTemplate('sidebar-fallback.html', variables);
  }

  public loadFormTemplate(): string {
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
    } catch (error) {
      console.error(`[HtmlTemplateLoader] Failed to load form template:`, error);
      return this._getDefaultFormTemplate();
    }
  }

  public clearCache(): void {
    this._templateCache.clear();
    if (this._options.enableLogging) {
      console.log(`[HtmlTemplateLoader] Cache cleared`);
    }
  }

  public generateNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  public getCacheSize(): number {
    return this._templateCache.size;
  }

  public updateOptions(options: Partial<HtmlTemplateLoaderOptions>): void {
    this._options = {
      ...this._options,
      ...options
    };
    
    if (this._options.enableCache) {
      this._ensureCacheSize();
    } else {
      this.clearCache();
    }
  }

  private _generateCacheKey(templateName: string, variables: TemplateVariables): string {
    // 生成更紧凑的缓存键
    const variablesHash = Object.keys(variables)
      .sort()
      .map(key => `${key}:${variables[key].length}`)
      .join('|');
    
    return `${templateName}:${variablesHash}`;
  }

  private _replaceVariables(templateContent: string, variables: TemplateVariables): string {
    let result = templateContent;
    
    for (const [key, value] of Object.entries(variables)) {
      const pattern = `{{${key}}}`;
      const regex = new RegExp(pattern.replace(/[.*+?^${}()\[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }

  private _ensureCacheSize(): void {
    if (this._templateCache.size >= this._options.cacheSize) {
      // 移除最早的缓存项
      const firstKey = this._templateCache.keys().next().value;
      if (firstKey) {
        this._templateCache.delete(firstKey);
      }
    }
  }

  private _getDefaultFormTemplate(): string {
    return `
      <div class="form-wrapper" id="formWrapper" style="display: none;">
        <div class="row-selectors-container">
          <div class="row-selector-item">
            <label for="headerRowInput">表头行:</label>
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
