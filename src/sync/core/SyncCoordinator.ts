import * as vscode from 'vscode';
import { 
  SyncHandler, 
  SyncEventData, 
  ISyncCoordinator 
} from './SyncTypes';

export class SyncCoordinator implements ISyncCoordinator {
  private handlers: Map<string, SyncHandler> = new Map();
  private eventQueue: SyncEventData[] = [];
  private isProcessing: boolean = false;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.setupEventQueueProcessor();
  }

  public registerHandler(handler: SyncHandler): void {
    if (this.handlers.has(handler.name)) {
      console.warn(`[SyncCoordinator] 处理器 ${handler.name} 已存在，将被覆盖`);
    }
    
    this.handlers.set(handler.name, handler);
    console.log(`[SyncCoordinator] 注册处理器: ${handler.name}`);
  }

  public unregisterHandler(handlerName: string): void {
    const handler = this.handlers.get(handlerName);
    if (handler) {
      handler.dispose();
      this.handlers.delete(handlerName);
      console.log(`[SyncCoordinator] 注销处理器: ${handlerName}`);
    }
  }

  public async emit(event: SyncEventData): Promise<void> {
    console.log(`[SyncCoordinator] 接收事件: ${event.type}`, event);
    
    this.eventQueue.push(event);
    
    if (!this.isProcessing) {
      await this.processEventQueue();
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event) {
          await this.processEvent(event);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: SyncEventData): Promise<void> {
    const eligibleHandlers = Array.from(this.handlers.values())
      .filter(handler => handler.enabled && handler.canHandle(event))
      .sort((a, b) => {
        const priorityA = (a as any).config?.priority || 0;
        const priorityB = (b as any).config?.priority || 0;
        return priorityB - priorityA;
      });

    console.log(`[SyncCoordinator] 事件 ${event.type} 的处理器:`, 
      eligibleHandlers.map(h => h.name));

    for (const handler of eligibleHandlers) {
      try {
        console.log(`[SyncCoordinator] 执行处理器: ${handler.name}`);
        await handler.handle(event);
      } catch (error) {
        console.error(`[SyncCoordinator] 处理器 ${handler.name} 执行失败:`, error);
      }
    }
  }

  private setupEventQueueProcessor(): void {
    const interval = setInterval(() => {
      if (this.eventQueue.length > 0 && !this.isProcessing) {
        this.processEventQueue().catch(error => {
          console.error('[SyncCoordinator] 处理事件队列失败:', error);
        });
      }
    }, 10);

    this.disposables.push(
      new vscode.Disposable(() => {
        clearInterval(interval);
      })
    );
  }

  public getHandler(handlerName: string): SyncHandler | undefined {
    return this.handlers.get(handlerName);
  }

  public getAllHandlers(): SyncHandler[] {
    return Array.from(this.handlers.values());
  }

  public dispose(): void {
    this.handlers.forEach(handler => handler.dispose());
    this.handlers.clear();
    
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    
    this.eventQueue = [];
  }
}
