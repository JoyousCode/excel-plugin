"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffCalculator = void 0;
// 差异计算工具
class DiffCalculator {
    // 计算两个字符串的差异
    static calculateStringDiff(oldValue, newValue) {
        const oldChars = oldValue.split('');
        const newChars = newValue.split('');
        const added = [];
        const removed = [];
        let i = 0, j = 0;
        while (i < oldChars.length || j < newChars.length) {
            if (i < oldChars.length && j < newChars.length) {
                if (oldChars[i] === newChars[j]) {
                    i++;
                    j++;
                }
                else {
                    // 查找下一个匹配点
                    let foundMatch = false;
                    for (let k = j + 1; k < newChars.length; k++) {
                        if (newChars[k] === oldChars[i]) {
                            // 记录添加的字符
                            for (let l = j; l < k; l++) {
                                added.push(newChars[l]);
                            }
                            j = k + 1;
                            i++;
                            foundMatch = true;
                            break;
                        }
                    }
                    if (!foundMatch) {
                        removed.push(oldChars[i]);
                        i++;
                    }
                }
            }
            else if (i < oldChars.length) {
                removed.push(oldChars[i]);
                i++;
            }
            else {
                added.push(newChars[j]);
                j++;
            }
        }
        return { added, removed };
    }
    // 计算单元格变化的最小集合
    static calculateCellChanges(oldCells, newCells) {
        const changes = [];
        const maxLength = Math.max(oldCells.length, newCells.length);
        for (let i = 0; i < maxLength; i++) {
            const oldValue = i < oldCells.length ? oldCells[i] : '';
            const newValue = i < newCells.length ? newCells[i] : '';
            if (oldValue !== newValue) {
                changes.push({
                    lineNumber: 0, // 行号需要在外部设置
                    column: `Column ${i + 1}`, // 列名需要在外部设置
                    value: newValue,
                    oldValue: oldValue
                });
            }
        }
        return changes;
    }
    // 智能合并连续的单元格变化
    static mergeCellChanges(changes) {
        const mergedChanges = [];
        const changeMap = new Map();
        // 按单元格位置分组
        changes.forEach(change => {
            const key = `${change.lineNumber}:${change.column}`;
            if (changeMap.has(key)) {
                // 更新为最新的值
                const existingChange = changeMap.get(key);
                existingChange.value = change.value;
                if (!existingChange.oldValue) {
                    existingChange.oldValue = change.oldValue;
                }
            }
            else {
                changeMap.set(key, { ...change });
            }
        });
        // 转换为数组
        changeMap.forEach(change => {
            mergedChanges.push(change);
        });
        return mergedChanges;
    }
    // 计算两个状态的差异
    static calculateStateDiff(oldState, newState) {
        const diffs = [];
        // 遍历新状态的所有键
        Object.keys(newState).forEach(key => {
            if (!oldState.hasOwnProperty(key)) {
                // 新增的键
                diffs.push({
                    type: 'add',
                    key: key,
                    value: newState[key]
                });
            }
            else if (oldState[key] !== newState[key]) {
                // 修改的键
                diffs.push({
                    type: 'update',
                    key: key,
                    oldValue: oldState[key],
                    newValue: newState[key]
                });
            }
        });
        // 遍历旧状态的所有键，查找删除的键
        Object.keys(oldState).forEach(key => {
            if (!newState.hasOwnProperty(key)) {
                // 删除的键
                diffs.push({
                    type: 'delete',
                    key: key,
                    oldValue: oldState[key]
                });
            }
        });
        return diffs;
    }
}
exports.DiffCalculator = DiffCalculator;
//# sourceMappingURL=DiffCalculator.js.map