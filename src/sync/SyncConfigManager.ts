import * as vscode from 'vscode';

export interface SyncConfig {
  headerToForm: boolean;
  cursorRowToCurrentRowInput: boolean;
  currentRowInputToCursor: boolean;
  editorToFormLessThan: boolean;
  editorToFormEqual: boolean;
  editorToFormGreaterThan: boolean;
  formToHeader: boolean;
}

export class SyncConfigManager {
  private static readonly CONFIG_SECTION = 'excelPlugin.sync';
  private config: SyncConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): SyncConfig {
    const config = vscode.workspace.getConfiguration(SyncConfigManager.CONFIG_SECTION);
    return {
      headerToForm: config.get<boolean>('headerToForm', true),
      cursorRowToCurrentRowInput: config.get<boolean>('cursorRowToCurrentRowInput', true),
      currentRowInputToCursor: config.get<boolean>('currentRowInputToCursor', true),
      editorToFormLessThan: config.get<boolean>('editorToForm.lessThan', true),
      editorToFormEqual: config.get<boolean>('editorToForm.equal', true),
      editorToFormGreaterThan: config.get<boolean>('editorToForm.greaterThan', true),
      formToHeader: config.get<boolean>('formToHeader', true)
    };
  }

  public refresh(): void {
    this.config = this.loadConfig();
  }

  public getConfig(): SyncConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<SyncConfig>): void {
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
