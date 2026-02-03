export interface InputEvent {
  timestamp: number;
  field: string;
  value: string;
}

export interface DebouncerConfig {
  minDelay: number;
  maxDelay: number;
  baseDelay: number;
  historySize: number;
  learningRate: number;
  batchSize: number;
  retryCount: number;
}

export interface FieldConfig {
  type: 'key' | 'normal' | 'description';
  priority: number;
}

export class SmartDebouncer {
  private config: DebouncerConfig;
  private inputHistory: Map<string, InputEvent[]> = new Map();
  private fieldConfigs: Map<string, FieldConfig> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private updateQueue: Map<string, { value: string; callback: () => void }> = new Map();
  private isProcessing: boolean = false;

  constructor(config: Partial<DebouncerConfig> = {}) {
    this.config = {
      minDelay: config.minDelay || 100,
      maxDelay: config.maxDelay || 1000,
      baseDelay: config.baseDelay || 300,
      historySize: config.historySize || 20,
      learningRate: config.learningRate || 0.3,
      batchSize: config.batchSize || 3,
      retryCount: config.retryCount || 3
    };
  }

  public registerField(field: string, fieldConfig: FieldConfig): void {
    this.fieldConfigs.set(field, fieldConfig);
    this.inputHistory.set(field, []);
  }

  public unregisterField(field: string): void {
    this.fieldConfigs.delete(field);
    this.inputHistory.delete(field);
    this.clearTimeout(field);
    this.updateQueue.delete(field);
  }

  public debounce(field: string, value: string, callback: () => void): void {
    this.clearTimeout(field);

    const now = Date.now();
    this.addInputEvent(field, { timestamp: now, field, value });

    const delay = this.calculateDelay(field);
    this.timeouts.set(field, setTimeout(() => {
      this.processUpdate(field, value, callback);
    }, delay));
  }

  private addInputEvent(field: string, event: InputEvent): void {
    const history = this.inputHistory.get(field) || [];
    history.push(event);

    if (history.length > this.config.historySize) {
      history.shift();
    }

    this.inputHistory.set(field, history);
  }

  private calculateDelay(field: string): number {
    const history = this.inputHistory.get(field) || [];
    if (history.length < 2) {
      return this.config.baseDelay;
    }

    // 计算输入频率
    const intervals: number[] = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i].timestamp - history[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

    // 确定输入模式
    let frequencyFactor = 1;
    if (avgInterval < 100) {
      // 快速模式
      frequencyFactor = 1.5 + (avgInterval / 100) * 0.5;
    } else if (avgInterval > 500) {
      // 慢速模式
      frequencyFactor = 0.5 + ((avgInterval - 500) / 500) * 0.5;
    }

    // 考虑时间因素
    const timeFactor = this.calculateTimeFactor();

    // 考虑字段类型
    const fieldFactor = this.calculateFieldFactor(field);

    // 计算最终延迟
    let delay = this.config.baseDelay * frequencyFactor * timeFactor * fieldFactor;

    // 确保延迟在合理范围内
    delay = Math.max(this.config.minDelay, Math.min(this.config.maxDelay, delay));

    return Math.round(delay);
  }

  private calculateTimeFactor(): number {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 9 && hour < 18) {
      // 工作时间
      return 0.8;
    } else if (hour >= 18 && hour < 22) {
      // 休息时间
      return 1.0;
    } else {
      // 深夜时间
      return 1.2;
    }
  }

  private calculateFieldFactor(field: string): number {
    const fieldConfig = this.fieldConfigs.get(field);
    if (!fieldConfig) {
      return 1.0;
    }

    switch (fieldConfig.type) {
      case 'key':
        return 0.7;
      case 'description':
        return 1.3;
      default:
        return 1.0;
    }
  }

  private processUpdate(field: string, value: string, callback: () => void): void {
    this.updateQueue.set(field, { value, callback });

    if (!this.isProcessing) {
      this.processUpdateQueue();
    }
  }

  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessing || this.updateQueue.size === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const updates = Array.from(this.updateQueue.entries()).slice(0, this.config.batchSize);
      
      for (const [field, { callback }] of updates) {
        await this.executeWithRetry(callback, this.config.retryCount);
        this.updateQueue.delete(field);
      }
    } finally {
      this.isProcessing = false;

      if (this.updateQueue.size > 0) {
        setTimeout(() => this.processUpdateQueue(), 10);
      }
    }
  }

  private async executeWithRetry(callback: () => void, retries: number): Promise<void> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        callback();
        return;
      } catch (error) {
        lastError = error as Error;
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }

    if (lastError) {
      console.error('Update failed after retries:', lastError);
    }
  }

  private clearTimeout(field: string): void {
    const timeout = this.timeouts.get(field);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(field);
    }
  }

  public clear(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.updateQueue.clear();
  }

  public dispose(): void {
    this.clear();
    this.inputHistory.clear();
    this.fieldConfigs.clear();
  }
}
