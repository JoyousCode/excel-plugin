/**
 * 智能自适应抖动系统
 * 用于优化表单输入处理，根据用户输入习惯动态调整延迟时间
 * 
 * 核心特性：
 * - 动态学习能力：根据用户输入频率调整延迟
 * - 多维度分析：考虑时间上下文、字段类型等因素
 * - 智能决策机制：快速输入增加延迟，慢速输入减少延迟
 * - 性能优化：批量更新、错误重试、内存管理
 */

class SmartDebouncer {
  /**
   * 构造函数
   * @param {Object} config - 配置参数
   * @param {number} config.minDelay - 最小延迟时间（毫秒）
   * @param {number} config.maxDelay - 最大延迟时间（毫秒）
   * @param {number} config.baseDelay - 基础延迟时间（毫秒）
   * @param {number} config.historySize - 历史数据大小
   * @param {number} config.learningRate - 学习率
   * @param {number} config.batchSize - 批量更新大小
   * @param {number} config.retryCount - 重试次数
   */
  constructor(config = {}) {
    this.config = {
      minDelay: config.minDelay || 100,
      maxDelay: config.maxDelay || 1000,
      baseDelay: config.baseDelay || 300,
      historySize: config.historySize || 20,
      learningRate: config.learningRate || 0.3,
      batchSize: config.batchSize || 3,
      retryCount: config.retryCount || 3
    };
    
    // 输入历史记录，按字段存储
    this.inputHistory = new Map();
    
    // 字段配置，存储字段类型和优先级
    this.fieldConfigs = new Map();
    
    // 超时定时器，用于跟踪正在等待执行的更新
    this.timeouts = new Map();
    
    // 更新队列，用于批量处理更新请求
    this.updateQueue = new Map();
    
    // 处理状态标志，防止并发处理
    this.isProcessing = false;
  }

  /**
   * 注册字段到智能抖动系统
   * @param {string} field - 字段标识符
   * @param {Object} fieldConfig - 字段配置
   * @param {string} fieldConfig.type - 字段类型（key/normal/description）
   * @param {number} fieldConfig.priority - 字段优先级
   */
  registerField(field, fieldConfig) {
    if (!field || typeof field !== 'string') {
      console.error('SmartDebouncer: 字段名必须是非空字符串');
      return;
    }
    
    this.fieldConfigs.set(field, {
      type: fieldConfig.type || 'normal',
      priority: fieldConfig.priority || 0
    });
    
    this.inputHistory.set(field, []);
  }

  /**
   * 从智能抖动系统中移除字段
   * @param {string} field - 字段标识符
   */
  unregisterField(field) {
    if (!field || typeof field !== 'string') {
      console.error('SmartDebouncer: 字段名必须是非空字符串');
      return;
    }
    
    this.fieldConfigs.delete(field);
    this.inputHistory.delete(field);
    this.clearTimeout(field);
    this.updateQueue.delete(field);
  }

  /**
   * 防抖处理函数
   * @param {string} field - 字段标识符
   * @param {*} value - 字段值
   * @param {Function} callback - 回调函数
   */
  debounce(field, value, callback) {
    if (!field || typeof field !== 'string') {
      console.error('SmartDebouncer: 字段名必须是非空字符串');
      return;
    }
    
    if (typeof callback !== 'function') {
      console.error('SmartDebouncer: 回调必须是函数');
      return;
    }
    
    // 清除之前的定时器
    this.clearTimeout(field);

    // 记录输入事件
    const now = Date.now();
    this.addInputEvent(field, { timestamp: now, field, value });

    // 计算动态延迟
    const delay = this.calculateDelay(field);
    
    // 设置新的定时器
    this.timeouts.set(field, setTimeout(() => {
      this.processUpdate(field, value, callback);
    }, delay));
  }

  /**
   * 添加输入事件到历史记录
   * @param {string} field - 字段标识符
   * @param {Object} event - 输入事件对象
   * @private
   */
  addInputEvent(field, event) {
    const history = this.inputHistory.get(field) || [];
    history.push(event);

    // 限制历史记录大小
    if (history.length > this.config.historySize) {
      history.shift();
    }

    this.inputHistory.set(field, history);
  }

  /**
   * 计算动态延迟时间
   * @param {string} field - 字段标识符
   * @returns {number} 计算后的延迟时间（毫秒）
   * @private
   */
  calculateDelay(field) {
    const history = this.inputHistory.get(field) || [];
    
    // 如果历史记录不足，使用基础延迟
    if (history.length < 2) {
      return this.config.baseDelay;
    }

    // 计算输入间隔
    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i].timestamp - history[i - 1].timestamp);
    }

    // 计算平均间隔
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

    // 根据输入频率计算因子
    let frequencyFactor = 1;
    if (avgInterval < 100) {
      // 快速输入：增加延迟
      frequencyFactor = 1.5 + (avgInterval / 100) * 0.5;
    } else if (avgInterval > 500) {
      // 慢速输入：减少延迟
      frequencyFactor = 0.5 + ((avgInterval - 500) / 500) * 0.5;
    }

    // 计算时间因子
    const timeFactor = this.calculateTimeFactor();
    
    // 计算字段因子
    const fieldFactor = this.calculateFieldFactor(field);

    // 计算最终延迟
    let delay = this.config.baseDelay * frequencyFactor * timeFactor * fieldFactor;
    
    // 限制延迟范围
    delay = Math.max(this.config.minDelay, Math.min(this.config.maxDelay, delay));

    return Math.round(delay);
  }

  /**
   * 计算时间因子
   * 根据当前时间调整延迟：工作时间减少延迟，休息时间正常，深夜时间增加延迟
   * @returns {number} 时间因子
   * @private
   */
  calculateTimeFactor() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 9 && hour < 18) {
      // 工作时间：减少延迟
      return 0.8;
    } else if (hour >= 18 && hour < 22) {
      // 休息时间：正常延迟
      return 1.0;
    } else {
      // 深夜时间：增加延迟
      return 1.2;
    }
  }

  /**
   * 计算字段因子
   * 根据字段类型调整延迟：关键字段减少延迟，描述性字段增加延迟
   * @param {string} field - 字段标识符
   * @returns {number} 字段因子
   * @private
   */
  calculateFieldFactor(field) {
    const fieldConfig = this.fieldConfigs.get(field);
    if (!fieldConfig) {
      return 1.0;
    }

    switch (fieldConfig.type) {
      case 'key':
        // 关键字段：减少延迟
        return 0.7;
      case 'description':
        // 描述性字段：增加延迟
        return 1.3;
      default:
        // 普通字段：正常延迟
        return 1.0;
    }
  }

  /**
   * 处理更新请求
   * @param {string} field - 字段标识符
   * @param {*} value - 字段值
   * @param {Function} callback - 回调函数
   * @private
   */
  processUpdate(field, value, callback) {
    this.updateQueue.set(field, { value, callback });

    // 如果当前没有正在处理的更新，启动处理
    if (!this.isProcessing) {
      this.processUpdateQueue();
    }
  }

  /**
   * 处理更新队列
   * 批量执行更新请求，优化网络请求
   * @private
   */
  async processUpdateQueue() {
    if (this.isProcessing || this.updateQueue.size === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 按优先级排序，优先处理关键字段
      const updates = Array.from(this.updateQueue.entries())
        .sort(([fieldA], [fieldB]) => {
          const priorityA = this.fieldConfigs.get(fieldA)?.priority || 0;
          const priorityB = this.fieldConfigs.get(fieldB)?.priority || 0;
          return priorityB - priorityA;
        })
        .slice(0, this.config.batchSize);
      
      // 执行批量更新
      for (const [field, { callback }] of updates) {
        await this.executeWithRetry(callback, this.config.retryCount);
        this.updateQueue.delete(field);
      }
    } catch (error) {
      console.error('SmartDebouncer: 处理更新队列时出错:', error);
    } finally {
      this.isProcessing = false;

      // 如果还有未处理的更新，继续处理
      if (this.updateQueue.size > 0) {
        setTimeout(() => this.processUpdateQueue(), 10);
      }
    }
  }

  /**
   * 带重试机制的执行函数
   * @param {Function} callback - 回调函数
   * @param {number} retries - 重试次数
   * @returns {Promise} 执行结果
   * @private
   */
  async executeWithRetry(callback, retries) {
    let lastError = null;

    for (let i = 0; i < retries; i++) {
      try {
        callback();
        return;
      } catch (error) {
        lastError = error;
        console.warn(`SmartDebouncer: 执行回调失败，${retries - i - 1}次重试机会`, error);
        // 指数退避策略
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
      }
    }

    if (lastError) {
      console.error('SmartDebouncer: 更新失败，已达到最大重试次数:', lastError);
    }
  }

  /**
   * 清除指定字段的定时器
   * @param {string} field - 字段标识符
   * @private
   */
  clearTimeout(field) {
    const timeout = this.timeouts.get(field);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(field);
    }
  }

  /**
   * 清除所有定时器和队列
   */
  clear() {
    // 清除所有定时器
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    
    // 清空更新队列
    this.updateQueue.clear();
  }

  /**
   * 销毁实例，释放资源
   */
  dispose() {
    this.clear();
    this.inputHistory.clear();
    this.fieldConfigs.clear();
  }

  /**
   * 获取当前配置
   * @returns {Object} 配置对象
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 更新配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    if (typeof newConfig !== 'object' || newConfig === null) {
      console.error('SmartDebouncer: 配置必须是对象');
      return;
    }
    
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
}

// 导出SmartDebouncer类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartDebouncer;
} else if (typeof window !== 'undefined') {
  window.SmartDebouncer = SmartDebouncer;
}
