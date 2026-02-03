"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncMode = exports.ConflictResolutionStrategy = exports.SyncStatus = exports.SyncSource = exports.SyncOperationType = void 0;
// 同步操作类型
var SyncOperationType;
(function (SyncOperationType) {
    SyncOperationType["EDITOR_CHANGE"] = "editorChange";
    SyncOperationType["FORM_CHANGE"] = "formChange";
    SyncOperationType["HEADER_CHANGE"] = "headerChange";
    SyncOperationType["CURSOR_CHANGE"] = "cursorChange";
})(SyncOperationType || (exports.SyncOperationType = SyncOperationType = {}));
// 同步操作来源
var SyncSource;
(function (SyncSource) {
    SyncSource["EDITOR"] = "editor";
    SyncSource["FORM"] = "form";
    SyncSource["SYSTEM"] = "system";
})(SyncSource || (exports.SyncSource = SyncSource = {}));
// 同步状态
var SyncStatus;
(function (SyncStatus) {
    SyncStatus["PENDING"] = "pending";
    SyncStatus["PROCESSING"] = "processing";
    SyncStatus["COMPLETED"] = "completed";
    SyncStatus["FAILED"] = "failed";
})(SyncStatus || (exports.SyncStatus = SyncStatus = {}));
// 冲突解决策略
var ConflictResolutionStrategy;
(function (ConflictResolutionStrategy) {
    ConflictResolutionStrategy["LATEST_WINS"] = "latestWins";
    ConflictResolutionStrategy["SOURCE_PRIORITY"] = "sourcePriority";
    ConflictResolutionStrategy["MERGE"] = "merge";
    ConflictResolutionStrategy["MANUAL"] = "manual";
})(ConflictResolutionStrategy || (exports.ConflictResolutionStrategy = ConflictResolutionStrategy = {}));
// 同步模式
var SyncMode;
(function (SyncMode) {
    SyncMode["REAL_TIME"] = "realTime";
    SyncMode["BATCH"] = "batch";
    SyncMode["MANUAL"] = "manual";
})(SyncMode || (exports.SyncMode = SyncMode = {}));
//# sourceMappingURL=SyncTypes.js.map