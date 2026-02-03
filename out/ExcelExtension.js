"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const XLSX = __importStar(require("xlsx"));
const ExcelSidebarProvider_1 = require("./ExcelSidebarProvider");
const SyncManagerV2_1 = require("./sync/SyncManagerV2");
const EditorUtils_1 = require("./utils/EditorUtils");
function activate(context) {
    console.log('Excel编辑器扩展已激活');
    try {
        const sidebarProvider = new ExcelSidebarProvider_1.ExcelSidebarProvider('excelPlugin.sidebar', context);
        const syncManager = new SyncManagerV2_1.SyncManagerV2(sidebarProvider);
        let isExtensionActive = true;
        let currentExcelFile = undefined;
        let currentExcelData = undefined;
        let currentEditor = undefined;
        let headerRowIndex = 1;
        let isEditorChangeFromExtension = false;
        let isEditingForm = false;
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = "$(excel) Excel编辑";
        statusBarItem.tooltip = "Excel编辑器已启用 (点击关闭)";
        statusBarItem.command = 'excelPlugin.toggleStatus';
        statusBarItem.show();
        const updateStatusBar = () => {
            if (isExtensionActive) {
                statusBarItem.text = "$(excel) Excel编辑";
                statusBarItem.tooltip = "Excel编辑器已启用 (点击关闭)";
            }
            else {
                statusBarItem.text = "$(circle-slash) Excel编辑";
                statusBarItem.tooltip = "Excel编辑器已关闭 (点击开启)";
            }
        };
        const isExcelFile = (filePath) => {
            if (!filePath)
                return false;
            const ext = path.extname(filePath).toLowerCase();
            return ['.xlsx', '.xls', '.xlsm', '.xlsb'].includes(ext);
        };
        const parseExcelFile = async (filePath, headerRowIndex) => {
            try {
                const buffer = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error('Excel文件中没有工作表');
                }
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                // 获取工作表的实际范围，包括末尾的空行
                let totalLines = 0;
                if (worksheet['!ref']) {
                    const range = XLSX.utils.decode_range(worksheet['!ref']);
                    totalLines = range.e.r + 1;
                }
                else {
                    totalLines = sheetData.length;
                }
                if (!Array.isArray(sheetData) || sheetData.length === 0) {
                    return { headers: [], firstRowHeaders: [], rows: [], sheetData: [], totalColumns: 0, totalLines: totalLines };
                }
                // 计算总列数，使用所有行中的最大列数
                let totalColumns = 0;
                for (const row of sheetData) {
                    if (Array.isArray(row) && row.length > totalColumns) {
                        totalColumns = row.length;
                    }
                }
                // 获取第一行表头用于固定占位符文本
                let firstRowHeaders = [];
                if (sheetData.length > 0 && Array.isArray(sheetData[0])) {
                    firstRowHeaders = sheetData[0].map((header, index) => {
                        if (header === null || header === undefined || header === '') {
                            return `Column ${index + 1}`;
                        }
                        return String(header).trim();
                    });
                }
                else if (sheetData.length > 0 && sheetData[0] !== null && sheetData[0] !== undefined && sheetData[0] !== '') {
                    // 处理第一行只有单列的情况
                    firstRowHeaders = [String(sheetData[0]).trim()];
                }
                // 确保表头行值不小于1且不大于总行数
                const validatedHeaderRowIndex = Math.max(1, Math.min(headerRowIndex || totalLines, totalLines));
                // 使用指定的表头行获取表头数据
                const headerRow = sheetData[validatedHeaderRowIndex - 1];
                let headers = [];
                if (Array.isArray(headerRow)) {
                    headers = headerRow.map((header, index) => {
                        if (header === null || header === undefined || header === '') {
                            return `Column ${index + 1}`;
                        }
                        return String(header).trim();
                    });
                }
                else {
                    // 即使只有一列，也使用实际的表头值
                    if (headerRow !== null && headerRow !== undefined && headerRow !== '') {
                        headers = [String(headerRow).trim()];
                    }
                    else {
                        headers = ['Column 1'];
                    }
                }
                // 确保headers长度等于总列数
                while (headers.length < totalColumns) {
                    headers.push(`Column ${headers.length + 1}`);
                }
                // 确保firstRowHeaders长度等于总列数
                while (firstRowHeaders.length < totalColumns) {
                    firstRowHeaders.push(`Column ${firstRowHeaders.length + 1}`);
                }
                const rows = [];
                for (let i = 0; i < sheetData.length; i++) {
                    if (i === validatedHeaderRowIndex - 1)
                        continue; // 跳过表头行
                    const rowData = sheetData[i];
                    if (Array.isArray(rowData)) {
                        const row = [];
                        for (let j = 0; j < totalColumns; j++) {
                            if (j < rowData.length) {
                                const cell = rowData[j];
                                row.push(cell !== undefined && cell !== null ? String(cell).trim() : '');
                            }
                            else {
                                row.push('');
                            }
                        }
                        rows.push(row);
                    }
                }
                return {
                    headers,
                    firstRowHeaders,
                    rows,
                    sheetData: rows.length > 0 ? [headers, ...rows] : [headers],
                    totalColumns,
                    totalLines: totalLines
                };
            }
            catch (error) {
                console.error('解析Excel文件失败:', error);
                throw new Error(`解析Excel文件失败: ${error instanceof Error ? error.message : String(error)}`);
            }
        };
        const parseEditorContent = (editor) => {
            if (!editor) {
                return undefined;
            }
            try {
                const document = editor.document;
                const lines = [];
                for (let i = 0; i < document.lineCount; i++) {
                    lines.push(document.lineAt(i).text);
                }
                if (lines.length === 0) {
                    return undefined;
                }
                // 确保表头行值不大于总行数
                if (headerRowIndex > lines.length) {
                    headerRowIndex = Math.min(headerRowIndex, lines.length);
                    if (headerRowIndex < 1) {
                        headerRowIndex = 1;
                    }
                }
                // 计算总列数，使用所有行中的最大列数
                let totalColumns = 0;
                for (const line of lines) {
                    let columnsCount = 0;
                    if (line.includes('\t')) {
                        columnsCount = line.split('\t').length;
                    }
                    else if (line.includes(',')) {
                        columnsCount = line.split(',').length;
                    }
                    else {
                        columnsCount = 1;
                    }
                    if (columnsCount > totalColumns) {
                        totalColumns = columnsCount;
                    }
                }
                // 获取第一行表头用于固定占位符文本
                let firstRowHeaders = [];
                if (lines.length > 0) {
                    const firstLine = lines[0];
                    if (firstLine.includes('\t')) {
                        firstRowHeaders = firstLine.split('\t').map((header, index) => {
                            const trimmedHeader = header.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                            return trimmedHeader || `Column ${index + 1}`;
                        });
                    }
                    else if (firstLine.includes(',')) {
                        firstRowHeaders = firstLine.split(',').map((header, index) => {
                            const trimmedHeader = header.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                            return trimmedHeader || `Column ${index + 1}`;
                        });
                    }
                    else {
                        // 处理第一行只有单列的情况
                        const trimmedHeader = firstLine.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                        if (trimmedHeader) {
                            firstRowHeaders = [trimmedHeader];
                        }
                        else {
                            firstRowHeaders = ['Column 1'];
                        }
                    }
                }
                // 使用表头行作为表头
                const headerLineIndex = headerRowIndex - 1;
                const headerLine = lines[headerLineIndex] || lines[0];
                let headers = [];
                if (headerLine.includes('\t')) {
                    headers = headerLine.split('\t').map((header, index) => {
                        // 移除表头中的引号
                        const trimmedHeader = header.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                        return trimmedHeader || `Column ${index + 1}`;
                    });
                }
                else if (headerLine.includes(',')) {
                    headers = headerLine.split(',').map((header, index) => {
                        // 移除表头中的引号
                        const trimmedHeader = header.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                        return trimmedHeader || `Column ${index + 1}`;
                    });
                }
                else {
                    // 即使只有一列，也使用实际的表头值
                    const trimmedHeader = headerLine.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                    if (trimmedHeader) {
                        headers = [trimmedHeader];
                    }
                    else {
                        headers = ['Column 1'];
                    }
                }
                // 确保headers长度等于总列数
                while (headers.length < totalColumns) {
                    headers.push(`Column ${headers.length + 1}`);
                }
                // 确保firstRowHeaders长度等于总列数
                while (firstRowHeaders.length < totalColumns) {
                    firstRowHeaders.push(`Column ${firstRowHeaders.length + 1}`);
                }
                const rows = [];
                for (let i = 0; i < lines.length; i++) {
                    if (i === headerLineIndex)
                        continue; // 跳过表头行
                    const line = lines[i].trim();
                    if (line === '')
                        continue;
                    let cells = [];
                    if (line.includes('\t')) {
                        cells = line.split('\t');
                    }
                    else if (line.includes(',')) {
                        cells = line.split(',');
                    }
                    else {
                        cells = [line];
                    }
                    const row = [];
                    for (let j = 0; j < totalColumns; j++) {
                        if (j < cells.length) {
                            row.push(cells[j].trim());
                        }
                        else {
                            row.push('');
                        }
                    }
                    rows.push(row);
                }
                return {
                    headers,
                    firstRowHeaders,
                    rows,
                    sheetData: rows.length > 0 ? [headers, ...rows] : [headers],
                    totalColumns,
                    totalLines: editor.document.lineCount
                };
            }
            catch (error) {
                console.error('解析编辑器内容失败:', error);
                return undefined;
            }
        };
        const autoLoadFile = async (editor) => {
            if (!isExtensionActive || !editor) {
                return;
            }
            const filePath = editor.document.fileName;
            if (!isExcelFile(filePath)) {
                sidebarProvider.clearData();
                return;
            }
            try {
                // 切换文件时，优先使用编辑器的实际内容（包括未保存的修改）来计算总行数和总列数
                const actualTotalLines = editor.document.lineCount;
                totalLines = actualTotalLines;
                // 优先使用编辑器的实际内容解析数据
                const editorData = parseEditorContent(editor);
                if (editorData) {
                    // 使用编辑器的实际列数
                    totalColumns = editorData.totalColumns;
                    // 只有当当前表头行值大于新文件的总行数时，才更新表头行值
                    if (headerRowIndex > actualTotalLines) {
                        headerRowIndex = actualTotalLines;
                    }
                    // 获取当前行值
                    const cursorPosition = editor.selection.active;
                    const cursorRowIndex = cursorPosition.line + 1;
                    // 只有当当前行值大于新文件的总行数时，才更新当前行值
                    if (cursorRowIndex > actualTotalLines) {
                        // 设置光标位置到新文件的最后一行
                        const newPosition = new vscode.Position(actualTotalLines - 1, 0);
                        const newSelection = new vscode.Selection(newPosition, newPosition);
                        editor.selection = newSelection;
                    }
                    currentExcelFile = filePath;
                    currentExcelData = editorData;
                    currentEditor = editor;
                    sidebarProvider.setData(editorData, filePath, headerRowIndex);
                    updateCurrentLineData(editor);
                    return;
                }
                // 如果编辑器内容解析失败，则尝试解析Excel文件
                const excelData = await parseExcelFile(filePath, headerRowIndex);
                if (excelData.headers.length === 0) {
                    const editorData = parseEditorContent(editor);
                    if (editorData) {
                        currentExcelFile = filePath;
                        currentExcelData = editorData;
                        currentEditor = editor;
                        headerRowIndex = editorData.totalLines;
                        totalColumns = editorData.totalColumns;
                        totalLines = editorData.totalLines;
                        sidebarProvider.setData(editorData, filePath, headerRowIndex);
                    }
                    return;
                }
                currentExcelFile = filePath;
                currentExcelData = excelData;
                currentEditor = editor;
                sidebarProvider.setData(excelData, filePath, headerRowIndex);
                updateCurrentLineData(editor);
            }
            catch (error) {
                console.error('加载Excel文件失败:', error);
                const editorData = parseEditorContent(editor);
                if (editorData) {
                    currentExcelFile = filePath;
                    currentExcelData = editorData;
                    currentEditor = editor;
                    // 只有当当前表头行值大于新文件的总行数时，才更新表头行值
                    if (headerRowIndex > editorData.totalLines) {
                        headerRowIndex = editorData.totalLines;
                    }
                    totalColumns = editorData.totalColumns;
                    totalLines = editorData.totalLines;
                    sidebarProvider.setData(editorData, filePath, headerRowIndex);
                }
            }
        };
        const updateCurrentLineData = (editor) => {
            if (!editor || isEditingForm || isEditorChangeFromExtension) {
                return;
            }
            try {
                const cursorPosition = editor.selection.active;
                const cursorRowIndex = cursorPosition.line + 1;
                const selection = editor.selection;
                const hasSelection = !selection.isEmpty;
                const selectedLines = Math.abs(selection.end.line - selection.start.line) + 1;
                if (hasSelection && selectedLines > 1) {
                    sidebarProvider.clearForm();
                    return;
                }
                // 优先使用内存中的总行数，否则使用编辑器的行数
                let totalLines = currentExcelData?.totalLines || editor.document.lineCount;
                const lines = [];
                for (let i = 0; i < editor.document.lineCount; i++) {
                    lines.push(editor.document.lineAt(i).text);
                }
                if (lines.length === 0) {
                    sidebarProvider.selectRow({}, -1, cursorRowIndex);
                    return;
                }
                // 确保表头行值不大于总行数
                if (headerRowIndex > totalLines) {
                    headerRowIndex = Math.min(headerRowIndex, totalLines);
                    if (headerRowIndex < 1) {
                        headerRowIndex = 1;
                    }
                }
                // 使用表头行作为表头
                const headerLineIndex = headerRowIndex - 1;
                const headerLine = lines[headerLineIndex] || lines[0];
                let headers = [];
                if (headerLine && headerLine.includes('\t')) {
                    headers = headerLine.split('\t').map((header, index) => {
                        // 移除表头中的引号
                        const trimmedHeader = header.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                        return trimmedHeader || `Column ${index + 1}`;
                    });
                }
                else if (headerLine && headerLine.includes(',')) {
                    headers = headerLine.split(',').map((header, index) => {
                        // 移除表头中的引号
                        const trimmedHeader = header.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                        return trimmedHeader || `Column ${index + 1}`;
                    });
                }
                else {
                    headers = ['Column 1'];
                }
                if (!Array.isArray(headers) || headers.length === 0) {
                    headers = ['Column 1'];
                }
                // 更新当前Excel数据的表头
                if (currentExcelData) {
                    currentExcelData.headers = headers;
                }
                // 发送更新后的表头到前端
                sidebarProvider.updateHeaders(headers);
                sidebarProvider.updateLineStats(editor.document.lineCount, cursorRowIndex);
                if (cursorPosition.line >= 0 && cursorPosition.line < lines.length) {
                    const currentLineText = lines[cursorPosition.line];
                    let cells = [];
                    if (currentLineText.includes('\t')) {
                        cells = currentLineText.split('\t');
                    }
                    else if (currentLineText.includes(',')) {
                        cells = currentLineText.split(',');
                    }
                    else {
                        cells = [currentLineText];
                    }
                    // 根据列索引直接构造数据对象
                    const rowObject = {};
                    // 使用总列数来遍历，确保所有列都能被处理
                    const totalColumns = currentExcelData?.totalColumns || headers.length;
                    for (let i = 0; i < totalColumns; i++) {
                        const header = i < headers.length ? headers[i] : `Column ${i + 1}`;
                        rowObject[header] = i < cells.length ? cells[i].trim() : '';
                    }
                    console.log(`[ExcelExtension] updateCurrentLineData: 准备发送数据`, {
                        cursorRowIndex,
                        headers,
                        cells,
                        rowObject
                    });
                    sidebarProvider.selectRow(rowObject, cursorPosition.line, cursorRowIndex);
                }
            }
            catch (error) {
                console.error('[ExcelExtension] updateCurrentLineData 错误:', error);
            }
        };
        const handleEditorChange = () => {
            if (!isExtensionActive || !currentEditor || !currentExcelFile) {
                return;
            }
            if (isEditorChangeFromExtension) {
                return;
            }
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const filePath = editor.document.fileName;
            if (currentExcelFile !== filePath)
                return;
            const newExcelData = parseEditorContent(editor);
            if (newExcelData) {
                currentExcelData = newExcelData;
            }
            const cursorPosition = editor.selection.active;
            const cursorRowIndex = cursorPosition.line + 1;
            const event = {
                type: 'editorChange',
                timestamp: Date.now(),
                source: 'editor',
                editor,
                headers: currentExcelData?.headers || [],
                headerRowIndex,
                cursorRowIndex,
                isEditingForm,
                isEditorChangeFromExtension
            };
            syncManager.emit(event);
        };
        const handleCursorChange = () => {
            try {
                if (!isExtensionActive || !currentEditor) {
                    return;
                }
                const editor = vscode.window.activeTextEditor;
                if (!editor)
                    return;
                const filePath = editor.document.fileName;
                if (currentExcelFile !== filePath)
                    return;
                updateCurrentLineData(editor);
                const cursorPosition = editor.selection.active;
                const cursorRowIndex = cursorPosition.line + 1;
                const cursorEvent = {
                    type: 'cursorRowChange',
                    timestamp: Date.now(),
                    source: 'editor',
                    editor,
                    cursorRowIndex,
                    isEditingForm
                };
                syncManager.emit(cursorEvent);
            }
            catch (error) {
                console.error('[ExcelExtension] handleCursorChange 错误:', error);
            }
        };
        // 定义总列数和总行数变量
        let totalColumns = 0;
        let totalLines = 0;
        const handleTextChange = (event) => {
            if (!isExtensionActive || !currentEditor) {
                return;
            }
            if (isEditorChangeFromExtension || isEditingForm) {
                return;
            }
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const filePath = editor.document.fileName;
            if (currentExcelFile !== filePath)
                return;
            // 重新解析整个文件以获取最新的数据
            const parsedData = parseEditorContent(editor);
            if (parsedData) {
                // 使用编辑器的实际行数作为总行数，包括所有行，包括空行
                const actualTotalLines = editor.document.lineCount;
                // 检查总列数是否发生变化
                const oldTotalColumns = totalColumns;
                currentExcelData = {
                    headers: parsedData.headers,
                    firstRowHeaders: parsedData.firstRowHeaders,
                    rows: parsedData.rows,
                    sheetData: parsedData.sheetData,
                    totalColumns: parsedData.totalColumns,
                    totalLines: actualTotalLines
                };
                // 更新总列数和总行数
                totalColumns = parsedData.totalColumns;
                totalLines = actualTotalLines;
                // 如果总列数发生变化，更新当前行数据到表单
                if (oldTotalColumns !== totalColumns) {
                    console.log(`[ExcelExtension] 总列数发生变化: ${oldTotalColumns} → ${totalColumns}，更新当前行数据`);
                    updateCurrentLineData(editor);
                }
            }
            const cursorPosition = editor.selection.active;
            const cursorRowIndex = cursorPosition.line + 1;
            // 使用编辑器的实际行数作为总行数
            const actualTotalLines = editor.document.lineCount;
            const editorEvent = {
                type: 'editorChange',
                timestamp: Date.now(),
                source: 'editor',
                editor,
                headers: currentExcelData?.headers || [],
                headerRowIndex,
                cursorRowIndex,
                totalColumns: currentExcelData?.totalColumns || 0,
                totalLines: actualTotalLines,
                isEditingForm,
                isEditorChangeFromExtension
            };
            syncManager.emit(editorEvent);
            // 直接更新侧边栏数据，确保总行数实时同步
            if (currentExcelData) {
                sidebarProvider.setData(currentExcelData, filePath, headerRowIndex);
            }
        };
        const openExcel = async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Excel Files': ['xlsx', 'xls', 'xlsm', 'xlsb'],
                    'All Files': ['*']
                }
            });
            if (fileUri && fileUri[0]) {
                const filePath = fileUri[0].fsPath;
                const document = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(document);
            }
        };
        const toggleStatus = () => {
            isExtensionActive = !isExtensionActive;
            updateStatusBar();
            if (!isExtensionActive) {
                sidebarProvider.clearForm();
            }
        };
        const addRow = async (rowData, copyCurrentRow) => {
            if (!currentEditor || !currentExcelData) {
                vscode.window.showWarningMessage('请先打开Excel文件');
                return;
            }
            const document = currentEditor.document;
            const lastLine = document.lineAt(document.lineCount - 1);
            const endPosition = lastLine.range.end;
            let newRow = '';
            if (copyCurrentRow) {
                // 复制当前光标所在行的数据到最后一行
                const currentPosition = currentEditor.selection.active;
                const currentLine = document.lineAt(currentPosition.line);
                newRow = currentLine.text;
                console.log('[ExcelExtension] 复制当前行数据到最后一行:', newRow);
            }
            else {
                // 原有逻辑：从表单数据创建新行
                newRow = currentExcelData.headers.map((header, index) => {
                    return rowData?.[header] || '';
                }).join('\t');
            }
            const edit = new vscode.WorkspaceEdit();
            edit.insert(document.uri, endPosition, '\n' + newRow);
            try {
                await vscode.workspace.applyEdit(edit).then(async (success) => {
                    try {
                        if (success && currentEditor) {
                            if (currentExcelData) {
                                // 如果是复制当前行，需要更新内存中的数据
                                if (copyCurrentRow) {
                                    const currentPosition = currentEditor.selection.active;
                                    const currentLineIndex = currentPosition.line;
                                    // 获取当前行的数据
                                    if (currentLineIndex >= 0 && currentLineIndex < currentExcelData.rows.length) {
                                        const currentRowData = [...currentExcelData.rows[currentLineIndex]];
                                        currentExcelData.rows.push(currentRowData);
                                    }
                                }
                                else {
                                    currentExcelData.rows.push(currentExcelData.headers.map(() => ''));
                                }
                            }
                            // 使用EditorUtils将光标移动到新添加的行
                            const newLineNumber = currentEditor.document.lineCount;
                            await EditorUtils_1.EditorUtils.gotoLine(newLineNumber, currentEditor);
                        }
                    }
                    catch (error) {
                        console.error('[ExcelExtension] addRow applyEdit then 回调错误:', error);
                    }
                }, (error) => {
                    console.error('[ExcelExtension] addRow applyEdit Promise 错误:', error);
                });
            }
            catch (error) {
                console.error('[ExcelExtension] addRow applyEdit 调用错误:', error);
            }
        };
        const updateCell = async (lineNumber, column, value, columnIndex) => {
            try {
                if (!currentExcelData || !currentEditor) {
                    return;
                }
                isEditingForm = true;
                const cursorRowIndex = lineNumber;
                // 实际更新编辑器中的内容
                const document = currentEditor.document;
                const lineIndex = lineNumber - 1;
                if (lineIndex >= 0 && lineIndex < document.lineCount) {
                    const line = document.lineAt(lineIndex);
                    const lineText = line.text;
                    // 解析行数据
                    const cells = lineText.includes('\t') ? lineText.split('\t') : lineText.split(',');
                    // 使用传递的列索引，而不是通过表头名称查找
                    if (columnIndex >= 0) {
                        // 确保cells数组有足够的长度
                        while (cells.length <= columnIndex) {
                            cells.push('');
                        }
                        // 更新单元格值
                        cells[columnIndex] = value;
                        // 重新组合行数据
                        const newLineText = cells.join('\t');
                        // 创建编辑操作
                        const edit = new vscode.WorkspaceEdit();
                        edit.replace(document.uri, line.range, newLineText);
                        // 应用编辑
                        await vscode.workspace.applyEdit(edit);
                    }
                }
                const formEvent = {
                    type: 'formChange',
                    timestamp: Date.now(),
                    source: 'form',
                    editor: currentEditor,
                    headers: currentExcelData.headers,
                    headerRowIndex,
                    cursorRowIndex,
                    rowIndex: lineNumber - headerRowIndex,
                    column,
                    value,
                    isEditingForm,
                    isEditorChangeFromExtension: true
                };
                isEditorChangeFromExtension = true;
                syncManager.emit(formEvent);
                try {
                    setTimeout(() => {
                        try {
                            isEditorChangeFromExtension = false;
                            isEditingForm = false;
                        }
                        catch (error) {
                            console.error('[ExcelExtension] setTimeout 回调错误:', error);
                        }
                    }, 50);
                }
                catch (error) {
                    console.error('[ExcelExtension] setTimeout 设置错误:', error);
                }
            }
            catch (error) {
                console.error('[ExcelExtension] updateCell 错误:', error);
            }
        };
        const headerRowChanged = async (newHeaderRowIndex) => {
            try {
                // 确保表头行值不小于1
                let validatedHeaderRowIndex = Math.max(1, newHeaderRowIndex);
                // 确保表头行值不大于总行数
                if (currentEditor) {
                    const totalLines = currentEditor.document.lineCount;
                    validatedHeaderRowIndex = Math.min(validatedHeaderRowIndex, totalLines);
                }
                headerRowIndex = validatedHeaderRowIndex;
                if (currentEditor) {
                    // 重新解析编辑器内容，获取新的表头数据
                    const editorData = parseEditorContent(currentEditor);
                    if (editorData) {
                        currentExcelData = editorData;
                    }
                    const headerEvent = {
                        type: 'headerChange',
                        timestamp: Date.now(),
                        source: 'system',
                        headers: currentExcelData?.headers || [],
                        headerRowIndex
                    };
                    syncManager.emit(headerEvent);
                    // 更新当前行数据
                    // 注意：这里不调用updateCurrentLineData，因为可能会导致表单闪烁
                    // 我们只需要更新表头，不需要重新填充表单
                }
            }
            catch (error) {
                console.error('[ExcelExtension] headerRowChanged 错误:', error);
            }
        };
        const currentRowChanged = async (currentRowValue) => {
            try {
                if (!currentEditor || !currentExcelData) {
                    return;
                }
                console.log(`[ExcelExtension] currentRowChanged 接收到行号: ${currentRowValue}`);
                // 使用EditorUtils将光标移动到指定行
                await EditorUtils_1.EditorUtils.gotoLine(currentRowValue, currentEditor);
                const cursorPosition = currentEditor.selection.active;
                const cursorRowIndex = cursorPosition.line + 1;
                const inputEvent = {
                    type: 'currentRowInputChange',
                    timestamp: Date.now(),
                    source: 'form',
                    editor: currentEditor,
                    headers: currentExcelData.headers,
                    headerRowIndex,
                    currentRowInputValue: currentRowValue,
                    isUpdatingFromExtension: false
                };
                const cursorEvent = {
                    type: 'currentRowInputToCursor',
                    timestamp: Date.now(),
                    source: 'form',
                    editor: currentEditor,
                    currentRowValue,
                    isUpdatingFromExtension: false
                };
                syncManager.emit(inputEvent);
                syncManager.emit(cursorEvent);
            }
            catch (error) {
                console.error('[ExcelExtension] currentRowChanged 错误:', error);
            }
        };
        const showSidebar = () => {
            vscode.commands.executeCommand('workbench.view.extension.excel-plugin');
        };
        const hideSidebar = () => {
            vscode.commands.executeCommand('workbench.action.closeSidebar');
        };
        const activatePlugin = () => {
            isExtensionActive = true;
            updateStatusBar();
        };
        const deactivatePlugin = () => {
            isExtensionActive = false;
            updateStatusBar();
            sidebarProvider.clearForm();
        };
        context.subscriptions.push(vscode.window.registerWebviewViewProvider('excelPlugin.sidebar', sidebarProvider), vscode.commands.registerCommand('excelPlugin.openExcel', openExcel), vscode.commands.registerCommand('excelPlugin.toggleStatus', toggleStatus), vscode.commands.registerCommand('excelPlugin.addRow', addRow), vscode.commands.registerCommand('excelPlugin.updateCell', updateCell), vscode.commands.registerCommand('excelPlugin.headerRowChanged', headerRowChanged), vscode.commands.registerCommand('excelPlugin.currentRowChanged', currentRowChanged), vscode.commands.registerCommand('excelPlugin.updateCurrentLineData', () => {
            if (currentEditor) {
                updateCurrentLineData(currentEditor);
            }
        }), vscode.commands.registerCommand('excelPlugin.showSidebar', showSidebar), vscode.commands.registerCommand('excelPlugin.hideSidebar', hideSidebar), vscode.commands.registerCommand('excelPlugin.activate', activatePlugin), vscode.commands.registerCommand('excelPlugin.deactivate', deactivatePlugin), vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                currentEditor = editor;
                autoLoadFile(editor);
            }
        }), vscode.window.onDidChangeTextEditorSelection(event => {
            try {
                if (event.textEditor === currentEditor) {
                    handleCursorChange();
                }
            }
            catch (error) {
                console.error('[ExcelExtension] onDidChangeTextEditorSelection 错误:', error);
            }
        }), vscode.workspace.onDidChangeTextDocument(event => {
            try {
                handleTextChange(event);
            }
            catch (error) {
                console.error('[ExcelExtension] onDidChangeTextDocument 错误:', error);
            }
        }), vscode.workspace.onDidChangeConfiguration(event => {
            try {
                if (event.affectsConfiguration('excelPlugin.sync')) {
                    syncManager.refreshConfig();
                }
            }
            catch (error) {
                console.error('[ExcelExtension] onDidChangeConfiguration 错误:', error);
            }
        }), statusBarItem);
        if (vscode.window.activeTextEditor) {
            currentEditor = vscode.window.activeTextEditor;
            autoLoadFile(currentEditor);
        }
    }
    catch (error) {
        console.error('[ExcelExtension] 激活扩展时发生错误:', error);
    }
}
function deactivate() {
    console.log('Excel编辑器扩展已停用');
}
//# sourceMappingURL=ExcelExtension.js.map