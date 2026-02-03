"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityQueue = void 0;
// 优先级队列
class PriorityQueue {
    items = [];
    // 入队
    enqueue(element, priority) {
        this.items.push({ element, priority });
        this.sort();
    }
    // 出队
    dequeue() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items.shift()?.element;
    }
    // 获取队首元素
    front() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items[0].element;
    }
    // 获取队尾元素
    back() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items[this.items.length - 1].element;
    }
    // 检查队列是否为空
    isEmpty() {
        return this.items.length === 0;
    }
    // 获取队列大小
    size() {
        return this.items.length;
    }
    // 清空队列
    clear() {
        this.items = [];
    }
    // 排序队列（按优先级从高到低）
    sort() {
        this.items.sort((a, b) => b.priority - a.priority);
    }
    // 遍历队列
    forEach(callback) {
        this.items.forEach((item, index) => {
            callback(item.element, item.priority, index);
        });
    }
    // 转换为数组
    toArray() {
        return this.items.map(item => item.element);
    }
}
exports.PriorityQueue = PriorityQueue;
//# sourceMappingURL=PriorityQueue.js.map