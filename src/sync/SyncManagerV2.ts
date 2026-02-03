import * as vscode from 'vscode';
import { SyncCoordinator } from './core/SyncCoordinator';
import { HeaderToFormSyncHandler } from './handlers/HeaderToFormSyncHandler';
import { CursorRowToCurrentRowInputSyncHandler } from './handlers/CursorRowToCurrentRowInputSyncHandler';
import { CurrentRowInputToCursorSyncHandler } from './handlers/CurrentRowInputToCursorSyncHandler';
import { EditorToFormSyncHandler_LessThan } from './handlers/EditorToFormSyncHandler_LessThan';
import { EditorToFormSyncHandler_Equal } from './handlers/EditorToFormSyncHandler_Equal';
import { EditorToFormSyncHandler_GreaterThan } from './handlers/EditorToFormSyncHandler_GreaterThan';
import { FormToHeaderSyncHandler } from './handlers/FormToHeaderSyncHandler';
import { SyncHandlerConfig } from './core/SyncTypes';
import { SyncConfigManager } from './SyncConfigManager';

export class SyncManagerV2 {
  private coordinator: SyncCoordinator;
  private configManager: SyncConfigManager;
  private sidebarProvider: any;

  constructor(sidebarProvider: any) {
    this.sidebarProvider = sidebarProvider;
    this.coordinator = new SyncCoordinator();
    this.configManager = new SyncConfigManager();
    
    this.registerHandlers();
  }

  private registerHandlers(): void {
    const config = this.configManager.getConfig();

    const handlerOptions = {
      sidebarProvider: this.sidebarProvider,
      config: { enabled: true, priority: 10, debounceMs: 50 }
    };

    this.coordinator.registerHandler(
      new HeaderToFormSyncHandler({
        ...handlerOptions,
        config: { 
          ...handlerOptions.config, 
          enabled: config.headerToForm 
        }
      })
    );

    this.coordinator.registerHandler(
      new CursorRowToCurrentRowInputSyncHandler({
        ...handlerOptions,
        config: { 
          ...handlerOptions.config, 
          enabled: config.cursorRowToCurrentRowInput 
        }
      })
    );

    this.coordinator.registerHandler(
      new CurrentRowInputToCursorSyncHandler({
        ...handlerOptions,
        config: { 
          ...handlerOptions.config, 
          enabled: config.currentRowInputToCursor 
        }
      })
    );

    this.coordinator.registerHandler(
      new EditorToFormSyncHandler_LessThan({
        ...handlerOptions,
        config: { 
          ...handlerOptions.config, 
          enabled: config.editorToFormLessThan 
        }
      })
    );

    this.coordinator.registerHandler(
      new EditorToFormSyncHandler_Equal({
        ...handlerOptions,
        config: { 
          ...handlerOptions.config, 
          enabled: config.editorToFormEqual 
        }
      })
    );

    this.coordinator.registerHandler(
      new EditorToFormSyncHandler_GreaterThan({
        ...handlerOptions,
        config: { 
          ...handlerOptions.config, 
          enabled: config.editorToFormGreaterThan 
        }
      })
    );

    this.coordinator.registerHandler(
      new FormToHeaderSyncHandler({
        ...handlerOptions,
        config: { 
          ...handlerOptions.config, 
          enabled: config.formToHeader 
        }
      })
    );
  }

  public async emit(event: any): Promise<void> {
    await this.coordinator.emit(event);
  }

  public refreshConfig(): void {
    this.configManager.refresh();
    
    const config = this.configManager.getConfig();
    const handlers = this.coordinator.getAllHandlers();

    const handlerConfigs: { [key: string]: boolean } = {
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
      (handler as any).enabled = enabled;
    });
  }

  public getCoordinator(): SyncCoordinator {
    return this.coordinator;
  }

  public dispose(): void {
    this.coordinator.dispose();
  }
}
