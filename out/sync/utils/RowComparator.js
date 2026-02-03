"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RowComparator = exports.RowComparison = void 0;
var RowComparison;
(function (RowComparison) {
    RowComparison[RowComparison["LESS_THAN"] = -1] = "LESS_THAN";
    RowComparison[RowComparison["EQUAL"] = 0] = "EQUAL";
    RowComparison[RowComparison["GREATER_THAN"] = 1] = "GREATER_THAN";
})(RowComparison || (exports.RowComparison = RowComparison = {}));
class RowComparator {
    static compare(headerRowIndex, cursorRowIndex) {
        if (headerRowIndex < cursorRowIndex) {
            return RowComparison.LESS_THAN;
        }
        else if (headerRowIndex > cursorRowIndex) {
            return RowComparison.GREATER_THAN;
        }
        else {
            return RowComparison.EQUAL;
        }
    }
    static isLessThan(headerRowIndex, cursorRowIndex) {
        return this.compare(headerRowIndex, cursorRowIndex) === RowComparison.LESS_THAN;
    }
    static isEqual(headerRowIndex, cursorRowIndex) {
        return this.compare(headerRowIndex, cursorRowIndex) === RowComparison.EQUAL;
    }
    static isGreaterThan(headerRowIndex, cursorRowIndex) {
        return this.compare(headerRowIndex, cursorRowIndex) === RowComparison.GREATER_THAN;
    }
}
exports.RowComparator = RowComparator;
//# sourceMappingURL=RowComparator.js.map