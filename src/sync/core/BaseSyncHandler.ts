import * as vscode from 'vscode';
import { 
  SyncHandler, 
  SyncEventData, 
  SyncEvent 
} from './SyncTypes';

export interface SyncHandlerConfig {
  enabled: boolean;
  priority: number;
  debounceMs?: number;
}

export interface SyncHandlerOptions {
  sidebarProvider: any;
  config: SyncHandlerConfig;
}

export abstract class BaseSyncHandler implements SyncHandler {
  protected readonly sidebarProvider: any;
  protected config: SyncHandlerConfig;
  protected disposables: vscode.Disposable[] = [];
  protected lastEventTime: number = 0;
  protected debounceTimer: NodeJS.Timeout | null = null;

  constructor(protected readonly options: SyncHandlerOptions) {
    this.sidebarProvider = options.sidebarProvider;
    this.config = options.config;
  }

  public get name(): string {
    return this.constructor.name;
  }

  public get enabled(): boolean {
    return this.config.enabled;
  }

  public set enabled(value: boolean) {
    this.config.enabled = value;
  }

  public abstract canHandle(event: SyncEventData): boolean;
  public abstract handle(event: SyncEventData): Promise<void> | void;

  protected debounce(callback: () => void): void {
    const debounceMs = this.config.debounceMs || 50;
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      callback();
      this.debounceTimer = null;
    }, debounceMs);
  }

  protected shouldProcessEvent(event: SyncEvent): boolean {
    if (!this.enabled) {
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastEvent = now - this.lastEventTime;
    
    if (timeSinceLastEvent < (this.config.debounceMs || 50)) {
      return false;
    }
    
    this.lastEventTime = now;
    return true;
  }

  protected log(message: string, data?: any): void {
    console.log(`[${this.name}] ${message}`, data || '');
  }

  protected logError(message: string, error: any): void {
    console.error(`[${this.name}] ${message}`, error);
  }

  public dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
