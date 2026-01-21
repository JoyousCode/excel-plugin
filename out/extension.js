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
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const XLSX = __importStar(require("xlsx"));
function activate(context) {
    console.log('Excel Editor扩展已激活');
    // 插件状态
    let isExtensionActive = true;
    let currentExcelFile = undefined;
    let currentExcelData = undefined;
    let sidebarProvider = undefined;
    let isEditingForm = false;
    let currentEditor = undefined;
    let lastFormUpdateTime = 0;
    let isLoadingFile = false;
    let editorChangeTimeout = undefined;
    let isEditorChangeFromExtension = false;
    // 状态栏项
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(excel) Excel编辑";
    statusBarItem.tooltip = "Excel编辑器已启用 (点击关闭)";
    statusBarItem.command = 'excelPlugin.toggleStatus';
    statusBarItem.show();
    // 更新状态栏显示
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
    // 检查是否是Excel文件
    const isExcelFile = (filePath) => {
        if (!filePath)
            return false;
        const ext = path.extname(filePath).toLowerCase();
        return ['.xlsx', '.xls', '.xlsm', '.xlsb'].includes(ext);
    };
    // 解析Excel文件
    const parseExcelFile = async (filePath) => {
        try {
            console.log(`开始解析Excel文件: ${path.basename(filePath)}`);
            const buffer = fs.readFileSync(filePath);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Excel文件中没有工作表');
            }
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            if (!Array.isArray(sheetData)) {
                return { headers: [], rows: [], sheetData: [] };
            }
            if (sheetData.length === 0) {
                return { headers: [], rows: [], sheetData: [] };
            }
            const firstRow = sheetData[0];
            let headers = [];
            if (Array.isArray(firstRow)) {
                headers = firstRow.map((header, index) => {
                    if (header === null || header === undefined || header === '') {
                        return `Column ${index + 1}`;
                    }
                    return String(header).trim();
                });
            }
            else {
                headers = ['Column 1'];
            }
            if (headers.length === 0) {
                if (sheetData.length > 1) {
                    const sampleRow = sheetData[1];
                    if (Array.isArray(sampleRow)) {
                        headers = sampleRow.map((_, index) => `Column ${index + 1}`);
                    }
                    else {
                        headers = ['Column 1'];
                    }
                }
                else {
                    headers = ['Column 1'];
                }
            }
            const rows = [];
            for (let i = 1; i < sheetData.length; i++) {
                const rowData = sheetData[i];
                if (Array.isArray(rowData)) {
                    const row = [];
                    for (let j = 0; j < headers.length; j++) {
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
                else if (rowData && typeof rowData === 'object') {
                    const row = [];
                    headers.forEach(header => {
                        const value = rowData[header];
                        row.push(value !== undefined && value !== null ? String(value).trim() : '');
                    });
                    rows.push(row);
                }
            }
            return {
                headers,
                rows,
                sheetData: rows.length > 0 ? [headers, ...rows] : [headers]
            };
        }
        catch (error) {
            console.error('解析Excel文件失败:', error);
            throw new Error(`解析Excel文件失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    // 解析编辑器文本内容
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
            // 解析第一行作为表头
            const firstLine = lines[0];
            let headers = [];
            if (firstLine.includes('\t')) {
                headers = firstLine.split('\t').map((header, index) => header.trim() || `Column ${index + 1}`);
            }
            else if (firstLine.includes(',')) {
                headers = firstLine.split(',').map((header, index) => header.trim() || `Column ${index + 1}`);
            }
            else {
                headers = ['Column 1'];
            }
            // 处理数据行
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
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
                for (let j = 0; j < headers.length; j++) {
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
                rows,
                sheetData: rows.length > 0 ? [headers, ...rows] : [headers]
            };
        }
        catch (error) {
            console.error('解析编辑器内容失败:', error);
            return undefined;
        }
    };
    // 从编辑器加载数据
    const loadDataFromEditor = (editor, filePath) => {
        if (!editor)
            return;
        try {
            const excelData = parseEditorContent(editor);
            if (!excelData || excelData.headers.length === 0) {
                console.log('从编辑器解析数据失败');
                return;
            }
            console.log(`从编辑器加载数据: ${excelData.headers.length} 列, ${excelData.rows.length} 行`);
            currentExcelFile = filePath;
            currentExcelData = excelData;
            currentEditor = editor;
            if (sidebarProvider) {
                sidebarProvider.setData(excelData, filePath);
                sidebarProvider.refresh();
            }
            // 更新当前行数据
            updateCurrentLineData(editor);
        }
        catch (error) {
            console.error('从编辑器加载数据失败:', error);
        }
    };
    // 自动加载文件
    const autoLoadFile = async (editor, forceReload = false) => {
        if (!isExtensionActive || !editor || isLoadingFile) {
            return;
        }
        const filePath = editor.document.fileName;
        console.log(`尝试加载文件: ${path.basename(filePath)}`);
        if (!isExcelFile(filePath)) {
            console.log('不是Excel文件，跳过加载');
            if (sidebarProvider) {
                sidebarProvider.clearData();
                sidebarProvider.refresh();
            }
            return;
        }
        // 如果文件相同且不是强制重新加载，则跳过
        if (!forceReload && filePath === currentExcelFile && currentExcelData) {
            console.log('文件已加载，跳过');
            updateCurrentLineData(editor);
            return;
        }
        isLoadingFile = true;
        try {
            console.log(`开始加载Excel文件: ${path.basename(filePath)}`);
            const excelData = await parseExcelFile(filePath);
            if (excelData.headers.length === 0) {
                console.log('Excel文件没有有效数据');
                loadDataFromEditor(editor, filePath);
                return;
            }
            console.log(`Excel数据加载成功: ${excelData.headers.length} 列, ${excelData.rows.length} 行`);
            currentExcelFile = filePath;
            currentExcelData = excelData;
            currentEditor = editor;
            if (sidebarProvider) {
                sidebarProvider.setData(excelData, filePath);
                sidebarProvider.refresh();
            }
            // 更新当前行数据
            updateCurrentLineData(editor);
            console.log(`文件加载完成: ${path.basename(filePath)}`);
        }
        catch (error) {
            console.error('加载Excel文件失败，尝试从编辑器解析:', error);
            loadDataFromEditor(editor, filePath);
        }
        finally {
            isLoadingFile = false;
        }
    };
    // 更新当前行的数据
    const updateCurrentLineData = (editor) => {
        if (!sidebarProvider) {
            return;
        }
        if (isEditingForm) {
            return;
        }
        const cursorPosition = editor.selection.active;
        const currentLine = cursorPosition.line;
        // 检查是否有选中文本
        const selection = editor.selection;
        const hasSelection = !selection.isEmpty;
        const selectedLines = Math.abs(selection.end.line - selection.start.line) + 1;
        // 如果有选中文本或多行选中，清空表单
        if (hasSelection && selectedLines > 1) {
            console.log('有选中文本或多行选中，清空表单');
            sidebarProvider.clearForm();
            return;
        }
        const excelRowNumber = currentLine + 1;
        // 获取表首行位置
        const headerRowIndex = sidebarProvider.getHeaderRowIndex();
        // 获取文档中的所有行
        const lines = [];
        for (let i = 0; i < editor.document.lineCount; i++) {
            lines.push(editor.document.lineAt(i).text);
        }
        // 如果没有行，更新当前行号显示
        if (lines.length === 0) {
            sidebarProvider.selectRow({}, -1, excelRowNumber, true);
            sidebarProvider.refresh();
            return;
        }
        // 根据表首行位置解析表头
        const headerLineIndex = headerRowIndex - 1; // 转换为0-based索引
        // 检查表首行索引是否在有效范围内
        if (headerLineIndex < 0 || headerLineIndex >= lines.length) {
            console.log(`表首行索引${headerLineIndex}超出范围，使用默认表头`);
            const headers = ['Column 1'];
            if (currentExcelData) {
                currentExcelData.headers = headers;
            }
            const documentLineCount = editor.document.lineCount;
            sidebarProvider.updateLineStats(documentLineCount, excelRowNumber);
            setTimeout(() => {
                if (!sidebarProvider) {
                    return;
                }
                if (currentLine >= 0 && currentLine < lines.length) {
                    const currentLineText = lines[currentLine];
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
                    const rowObject = {};
                    headers.forEach((header, index) => {
                        rowObject[header] = index < cells.length ? cells[index].trim() : '';
                    });
                    const dataRowIndex = currentLine - headerRowIndex;
                    console.log(`更新表单显示第${dataRowIndex + 1}行:`, rowObject);
                    sidebarProvider.selectRow(rowObject, dataRowIndex, excelRowNumber, true);
                }
                else {
                    console.log(`当前行超出文档范围: 行${excelRowNumber}，文档行数: ${lines.length}`);
                    sidebarProvider.selectRow({}, -1, excelRowNumber, true);
                }
            }, 50);
            return;
        }
        const headerLine = lines[headerLineIndex];
        let headers = [];
        if (headerLine && headerLine.includes('\t')) {
            headers = headerLine.split('\t').map((header, index) => header.trim() || `Column ${index + 1}`);
        }
        else if (headerLine && headerLine.includes(',')) {
            headers = headerLine.split(',').map((header, index) => header.trim() || `Column ${index + 1}`);
        }
        else {
            headers = ['Column 1'];
        }
        // 更新currentExcelData中的headers（如果存在）
        if (currentExcelData) {
            currentExcelData.headers = headers;
        }
        // 确保侧边栏的行统计信息也得到更新
        const documentLineCount = editor.document.lineCount;
        sidebarProvider.updateLineStats(documentLineCount, excelRowNumber);
        // 延迟执行selectRow，确保表单已经渲染完成
        setTimeout(() => {
            if (!sidebarProvider) {
                return;
            }
            // 检查当前行是否在有效范围内
            if (currentLine >= 0 && currentLine < lines.length) {
                // 有效数据行，直接从编辑器获取当前行的最新内容
                const currentLineText = lines[currentLine];
                let cells;
                // 解析当前行
                if (currentLineText.includes('\t')) {
                    cells = currentLineText.split('\t');
                }
                else if (currentLineText.includes(',')) {
                    cells = currentLineText.split(',');
                }
                else {
                    cells = [currentLineText];
                }
                // 创建行对象
                const rowObject = {};
                headers.forEach((header, index) => {
                    rowObject[header] = index < cells.length ? cells[index].trim() : '';
                });
                // 根据表首行位置计算数据行索引
                const dataRowIndex = currentLine - headerRowIndex;
                console.log(`更新表单显示第${dataRowIndex + 1}行:`, rowObject);
                // 更新表单数据，无论dataRowIndex是否为负数都要填充数据
                sidebarProvider.selectRow(rowObject, dataRowIndex, excelRowNumber, true);
            }
        }, 50);
    };
    // 更新编辑器中的单元格 - 修复表单到编辑器的绑定
    const updateCellInEditor = async (rowIndex, column, value) => {
        if (!currentExcelData || !currentEditor) {
            console.warn('[Extension] 无法更新单元格: 没有Excel数据或编辑器');
            return;
        }
        const columnIndex = currentExcelData.headers.indexOf(column);
        if (columnIndex === -1) {
            console.warn(`[Extension] 未找到列: ${column}`);
            return;
        }
        // 标记正在编辑表单，防止updateCurrentLineData覆盖表单数据
        isEditingForm = true;
        console.log(`[Extension] 开始更新单元格: 行${rowIndex + 1}, 列"${column}", 值: "${value}"`);
        if (!sidebarProvider) {
            console.warn('[Extension] 无法更新单元格: sidebarProvider未定义');
            return;
        }
        // rowIndex是相对于表首行的索引（0-based），headerRowIndex是表首行的行号（1-based）
        // 编辑器行号（0-based）= rowIndex + headerRowIndex
        const headerRowIndex = sidebarProvider.getHeaderRowIndex();
        const lineNumber = rowIndex + headerRowIndex;
        console.log(`[Extension] 编辑器行号: ${lineNumber + 1} (0-based: ${lineNumber}), rowIndex: ${rowIndex}, headerRowIndex: ${headerRowIndex}`);
        try {
            const editor = currentEditor;
            const document = editor.document;
            // 检查行是否存在于编辑器中
            if (lineNumber < 0 || lineNumber >= document.lineCount) {
                console.warn(`[Extension] 行号 ${lineNumber + 1} 超出文档范围`);
                return;
            }
            // 如果内存数据中的行索引超出范围，先扩展内存数据
            if (rowIndex >= currentExcelData.rows.length) {
                console.log(`[Extension] 行索引 ${rowIndex} 超出内存数据范围，正在扩展内存数据...`);
                // 扩展rows数组到足够大
                while (currentExcelData.rows.length <= rowIndex) {
                    currentExcelData.rows.push(new Array(currentExcelData.headers.length).fill(''));
                }
            }
            const lineText = document.lineAt(lineNumber).text;
            console.log(`[Extension] 原始行文本: "${lineText}"`);
            let cells;
            // 解析行
            if (lineText.includes('\t')) {
                cells = lineText.split('\t');
            }
            else if (lineText.includes(',')) {
                cells = lineText.split(',');
            }
            else {
                cells = [lineText];
            }
            console.log(`[Extension] 解析后的单元格:`, cells);
            // 确保cells数组足够长
            while (cells.length <= columnIndex) {
                cells.push('');
            }
            // 更新单元格
            const oldValue = cells[columnIndex];
            cells[columnIndex] = value;
            // 重新构建行文本
            const newLineText = cells.join('\t');
            console.log(`[Extension] 新行文本: "${newLineText}"`);
            // 如果值没有变化，跳过更新
            if (oldValue === value) {
                console.log(`[Extension] 值未变化，跳过更新`);
                return;
            }
            // 标记扩展正在编辑
            isEditorChangeFromExtension = true;
            // 应用编辑
            const edit = new vscode.WorkspaceEdit();
            const lineRange = new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, lineText.length));
            edit.replace(document.uri, lineRange, newLineText);
            // 使用await确保编辑完成
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                console.log(`[Extension] ✅ 成功更新: 第${lineNumber + 1}行 "${column}" = "${value}"`);
                // 只有当rowIndex >= 0时才更新内存数据中的rows数组
                // rowIndex为负数时，表示当前行在表首行之前，不需要更新内存数据
                if (rowIndex >= 0) {
                    currentExcelData.rows[rowIndex][columnIndex] = value;
                    // 更新内存中的sheetData - 确保sheetData足够长
                    while (currentExcelData.sheetData.length <= rowIndex + 1) {
                        currentExcelData.sheetData.push(new Array(currentExcelData.headers.length).fill(''));
                    }
                    currentExcelData.sheetData[rowIndex + 1][columnIndex] = value;
                }
                else {
                    console.log(`[Extension] rowIndex为负数${rowIndex}，跳过内存数据更新，仅更新编辑器`);
                }
                // 更新最后修改时间
                lastFormUpdateTime = Date.now();
            }
            else {
                console.error('[Extension] ❌ 应用编辑失败');
            }
            // 重置标志，延迟更长时间以确保编辑器更新完成
            setTimeout(() => {
                isEditorChangeFromExtension = false;
                isEditingForm = false;
            }, 500);
        }
        catch (error) {
            console.error('[Extension] ❌ 更新编辑器单元格失败:', error);
            isEditorChangeFromExtension = false;
            isEditingForm = false;
        }
    };
    // 处理编辑器内容变化
    const handleEditorContentChange = () => {
        if (!isExtensionActive || !currentEditor || !currentExcelFile) {
            return;
        }
        // 如果变化是由扩展引起的，跳过
        if (isEditorChangeFromExtension) {
            return;
        }
        // 清除之前的定时器
        if (editorChangeTimeout) {
            clearTimeout(editorChangeTimeout);
        }
        // 设置新的定时器，防抖处理
        editorChangeTimeout = setTimeout(() => {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const filePath = editor.document.fileName;
            if (currentExcelFile !== filePath)
                return;
            // 重新解析整个文档内容以更新内存数据
            const newExcelData = parseEditorContent(editor);
            if (newExcelData) {
                // 更新内存中的数据
                currentExcelData = newExcelData;
                // 更新侧边栏显示，包括行数统计
                if (sidebarProvider) {
                    sidebarProvider.setData(newExcelData, filePath);
                    sidebarProvider.refresh();
                }
            }
            // 内容变化后，重新更新当前行数据
            updateCurrentLineData(editor);
        }, 100); // 缩短延迟时间，提高响应速度
    };
    // 监听文档保存事件，确保保存后侧边栏显示更新
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
        if (!isExtensionActive || !isExcelFile(document.fileName) || !currentEditor) {
            return;
        }
        // 检查是否是当前Excel文件
        if (currentExcelFile === document.fileName) {
            // 重新解析文档内容并更新显示
            const newExcelData = parseEditorContent(currentEditor);
            if (newExcelData) {
                currentExcelData = newExcelData;
                if (sidebarProvider) {
                    sidebarProvider.setData(newExcelData, document.fileName);
                    sidebarProvider.refresh();
                }
            }
        }
    }));
    // 添加新行
    const addNewRow = (rowData) => {
        if (!currentExcelData || !currentEditor) {
            vscode.window.showWarningMessage('请先打开一个Excel文件');
            return;
        }
        const newRow = currentExcelData.headers.map((header) => rowData[header] || '');
        const newRowIndex = currentExcelData.rows.length;
        // 更新内存数据
        currentExcelData.rows.push(newRow);
        // 确保sheetData也同步更新
        while (currentExcelData.sheetData.length <= newRowIndex + 1) {
            currentExcelData.sheetData.push(new Array(currentExcelData.headers.length).fill(''));
        }
        currentExcelData.sheetData[newRowIndex + 1] = [...newRow];
        const newRowCount = currentExcelData.rows.length;
        console.log(`已添加新行，总行数: ${newRowCount}`);
        try {
            const editor = currentEditor;
            const document = editor.document;
            const newLineText = newRow.join('\t');
            const edit = new vscode.WorkspaceEdit();
            const lastLine = document.lineCount;
            const insertPosition = new vscode.Position(lastLine, 0);
            // 在文档末尾添加新行
            if (lastLine > 0) {
                edit.insert(document.uri, insertPosition, '\n' + newLineText);
            }
            else {
                // 如果没有内容，先添加表头
                const headersText = currentExcelData.headers.join('\t');
                edit.insert(document.uri, new vscode.Position(0, 0), headersText + '\n' + newLineText);
            }
            // 标记扩展正在编辑
            isEditorChangeFromExtension = true;
            vscode.workspace.applyEdit(edit).then(() => {
                // 移动光标到新添加的行
                setTimeout(() => {
                    if (editor) {
                        const newCursorLine = lastLine;
                        const newCursorPosition = new vscode.Position(newCursorLine, 0);
                        editor.selection = new vscode.Selection(newCursorPosition, newCursorPosition);
                        // 滚动到新行
                        editor.revealRange(new vscode.Range(newCursorPosition, newCursorPosition));
                        // 更新表单显示新添加的行数据
                        const rowObject = {};
                        currentExcelData.headers.forEach((header, index) => {
                            rowObject[header] = newRow[index] || '';
                        });
                        if (sidebarProvider) {
                            const excelRowNumber = newCursorLine + 1;
                            sidebarProvider.selectRow(rowObject, newRowIndex, excelRowNumber, true);
                        }
                    }
                    // 重置扩展编辑标志
                    setTimeout(() => {
                        isEditorChangeFromExtension = false;
                    }, 100);
                }, 100);
            });
        }
        catch (error) {
            console.error('在编辑器添加新行失败:', error);
            vscode.window.showErrorMessage(`添加新行失败: ${error instanceof Error ? error.message : String(error)}`);
            // 出错时也要重置标志
            isEditorChangeFromExtension = false;
        }
        if (sidebarProvider) {
            sidebarProvider.refresh();
        }
    };
    // 激活插件
    const activateExtension = () => {
        console.log('激活Excel编辑器插件');
        isExtensionActive = true;
        updateStatusBar();
        if (sidebarProvider) {
            sidebarProvider.setExtensionActive(true);
        }
        // 检查当前编辑器
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const filePath = editor.document.fileName;
            if (isExcelFile(filePath)) {
                console.log('当前是Excel文件，自动加载');
                autoLoadFile(editor);
            }
            else {
                console.log('当前不是Excel文件，显示空状态');
                if (sidebarProvider) {
                    sidebarProvider.clearData();
                    sidebarProvider.refresh();
                }
            }
        }
        else {
            console.log('没有活动的编辑器');
            if (sidebarProvider) {
                sidebarProvider.clearData();
                sidebarProvider.refresh();
            }
        }
    };
    // 关闭插件
    const deactivateExtension = () => {
        console.log('关闭Excel编辑器插件');
        isExtensionActive = false;
        updateStatusBar();
        // 清理数据
        currentExcelFile = undefined;
        currentExcelData = undefined;
        currentEditor = undefined;
        if (sidebarProvider) {
            sidebarProvider.clearData();
            sidebarProvider.setExtensionActive(false);
            sidebarProvider.refresh();
        }
    };
    // 切换插件状态
    const toggleExtensionStatus = () => {
        console.log(`切换插件状态: ${isExtensionActive ? '关闭' : '开启'}`);
        if (isExtensionActive) {
            deactivateExtension();
        }
        else {
            activateExtension();
        }
    };
    // 切换状态命令
    const toggleStatusCommand = vscode.commands.registerCommand('excelPlugin.toggleStatus', () => {
        toggleExtensionStatus();
    });
    // 创建侧边栏提供者
    sidebarProvider = new ExcelSidebarProvider(context.extensionUri, isExtensionActive, (headerRowIndex) => {
        // 表首行变化回调
        console.log(`[Extension] 表首行变化回调: ${headerRowIndex}`);
        if (currentEditor && currentExcelFile) {
            const editor = currentEditor;
            const lines = [];
            for (let i = 0; i < editor.document.lineCount; i++) {
                lines.push(editor.document.lineAt(i).text);
            }
            // 根据新的表首行位置解析表头
            const headerLineIndex = headerRowIndex - 1;
            let newHeaders = [];
            if (headerLineIndex >= 0 && headerLineIndex < lines.length) {
                const headerLine = lines[headerLineIndex];
                if (headerLine && headerLine.includes('\t')) {
                    newHeaders = headerLine.split('\t').map((header, index) => header.trim() || `Column ${index + 1}`);
                }
                else if (headerLine && headerLine.includes(',')) {
                    newHeaders = headerLine.split(',').map((header, index) => header.trim() || `Column ${index + 1}`);
                }
                else {
                    newHeaders = ['Column 1'];
                }
            }
            else {
                newHeaders = ['Column 1'];
            }
            // 更新内存中的表头
            if (currentExcelData) {
                currentExcelData.headers = newHeaders;
            }
            // 发送新的表头到webview
            if (sidebarProvider && sidebarProvider['_view']) {
                sidebarProvider['_view'].webview.postMessage({
                    type: 'updateHeaders',
                    headers: newHeaders
                });
            }
            console.log(`[Extension] 表首行变化，更新表头:`, newHeaders);
            // 重新获取当前行的数据并更新表单
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.fileName === currentExcelFile) {
                console.log(`[Extension] 表首行变化后重新获取当前行数据`);
                updateCurrentLineData(activeEditor);
            }
        }
    });
    // 注册侧边栏视图
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("excelPlugin.sidebar", sidebarProvider));
    // 监听编辑器切换事件
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        console.log('编辑器切换事件');
        if (editor && isExtensionActive) {
            const filePath = editor.document.fileName;
            console.log(`切换到文件: ${path.basename(filePath)}`);
            if (isExcelFile(filePath)) {
                if (filePath !== currentExcelFile) {
                    console.log('切换到新的Excel文件，自动加载');
                    await autoLoadFile(editor);
                }
                else {
                    console.log('切换到已加载的Excel文件，更新表单');
                    updateCurrentLineData(editor);
                }
            }
            else {
                console.log('切换到非Excel文件，清空表单');
                if (sidebarProvider) {
                    sidebarProvider.clearData();
                    sidebarProvider.refresh();
                }
                // 重置当前Excel文件和数据状态
                currentExcelFile = undefined;
                currentExcelData = undefined;
            }
        }
        else if (isExtensionActive) {
            console.log('没有活动的编辑器或插件未激活');
            if (sidebarProvider) {
                sidebarProvider.clearData();
                sidebarProvider.refresh();
            }
        }
    }));
    // 监听光标位置变化
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection((event) => {
        if (isExtensionActive && currentExcelData) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const filePath = editor.document.fileName;
                if (isExcelFile(filePath) && filePath === currentExcelFile) {
                    updateCurrentLineData(event.textEditor);
                }
            }
        }
    }));
    // 监听编辑器内容变化
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
        if (!isExtensionActive) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === event.document) {
            const filePath = editor.document.fileName;
            if (currentExcelFile && filePath === currentExcelFile) {
                handleEditorContentChange();
            }
        }
    }));
    // 打开Excel文件命令
    const openExcelCommand = vscode.commands.registerCommand('excelPlugin.openExcel', async () => {
        if (!isExtensionActive) {
            vscode.window.showWarningMessage('请先激活Excel编辑器插件');
            return;
        }
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: {
                'Excel文件': ['xlsx', 'xls', 'xlsm', 'xlsb']
            }
        });
        if (uris && uris[0]) {
            const filePath = uris[0].fsPath;
            try {
                const document = await vscode.workspace.openTextDocument(filePath);
                const editor = await vscode.window.showTextDocument(document);
                await autoLoadFile(editor, true);
            }
            catch (error) {
                console.error(`打开文件失败: ${error}`);
                vscode.window.showErrorMessage(`打开文件失败: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    });
    // 添加行命令
    const addRowCommand = vscode.commands.registerCommand('excelPlugin.addRow', async () => {
        if (!isExtensionActive) {
            vscode.window.showWarningMessage('请先激活Excel编辑器插件');
            return;
        }
        if (sidebarProvider) {
            const rowData = await sidebarProvider.getFormData();
            if (rowData) {
                addNewRow(rowData);
            }
            else {
                vscode.window.showWarningMessage('没有表单数据可添加');
            }
        }
    });
    // 更新单元格命令
    context.subscriptions.push(vscode.commands.registerCommand('excelPlugin.updateCell', async (rowIndex, column, value) => {
        await updateCellInEditor(rowIndex, column, value);
    }));
    // 开始编辑命令
    context.subscriptions.push(vscode.commands.registerCommand('excelPlugin.startEditing', () => {
        isEditingForm = true;
        console.log('开始编辑表单');
    }));
    // 结束编辑命令
    context.subscriptions.push(vscode.commands.registerCommand('excelPlugin.endEditing', () => {
        isEditingForm = false;
        console.log('结束编辑表单');
    }));
    // 激活插件命令
    context.subscriptions.push(vscode.commands.registerCommand('excelPlugin.activate', () => {
        activateExtension();
    }));
    // 关闭插件命令
    context.subscriptions.push(vscode.commands.registerCommand('excelPlugin.deactivate', () => {
        deactivateExtension();
    }));
    // 刷新命令
    context.subscriptions.push(vscode.commands.registerCommand('excelPlugin.refresh', () => {
        if (isExtensionActive && currentEditor) {
            autoLoadFile(currentEditor, true);
        }
    }));
    context.subscriptions.push(toggleStatusCommand, openExcelCommand, addRowCommand, statusBarItem);
    // 初始状态更新
    updateStatusBar();
    // 延迟激活插件，确保侧边栏已加载
    setTimeout(() => {
        activateExtension();
    }, 1000);
    console.log('Excel编辑器插件已加载，初始状态为已激活');
}
class ExcelSidebarProvider {
    _extensionUri;
    _onHeaderRowChanged;
    _view;
    _excelData = undefined;
    _currentFile = '';
    _currentRowIndex = -1;
    _currentLineNumber = 0;
    _formData = {};
    _isFormEditing = false;
    _isExtensionActive = true;
    _headerRowIndex = 1;
    constructor(_extensionUri, isExtensionActive, _onHeaderRowChanged) {
        this._extensionUri = _extensionUri;
        this._onHeaderRowChanged = _onHeaderRowChanged;
        this._isExtensionActive = isExtensionActive;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, this._isExtensionActive);
        // 监听侧边栏可见性变化
        webviewView.onDidChangeVisibility(() => {
            console.log('侧边栏可见性变化:', webviewView.visible);
            if (!webviewView.visible) {
                // 侧边栏关闭时，关闭插件
                vscode.commands.executeCommand('excelPlugin.deactivate');
            }
            else {
                // 侧边栏打开时，如果插件未激活则激活
                vscode.commands.executeCommand('excelPlugin.activate');
            }
        });
        // 在 ExcelSidebarProvider 类的 resolveWebviewView 方法中，更新消息处理
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'updateCell':
                    console.log(`[Extension] 收到更新单元格消息: 行${data.rowIndex}, 列"${data.column}", 值: "${data.value}"`);
                    vscode.commands.executeCommand('excelPlugin.updateCell', data.rowIndex, data.column, data.value);
                    break;
                case 'addRow':
                    console.log('[Extension] 收到添加行消息:', data.rowData);
                    this._addRow(data.rowData);
                    break;
                case 'clearForm':
                    console.log('[Extension] 收到清空表单消息');
                    this.clearForm();
                    break;
                case 'openExcel':
                    console.log('[Extension] 收到打开Excel消息');
                    vscode.commands.executeCommand('excelPlugin.openExcel');
                    break;
                case 'getFormData':
                    console.log('[Extension] 收到获取表单数据消息');
                    this._sendFormData();
                    break;
                case 'startEditing':
                    console.log('[Extension] 收到开始编辑消息');
                    vscode.commands.executeCommand('excelPlugin.startEditing');
                    this._isFormEditing = true;
                    break;
                case 'endEditing':
                    console.log('[Extension] 收到结束编辑消息');
                    vscode.commands.executeCommand('excelPlugin.endEditing');
                    this._isFormEditing = false;
                    break;
                case 'toggleExtension':
                    console.log('[Extension] 收到切换插件状态消息');
                    vscode.commands.executeCommand('excelPlugin.toggleStatus');
                    break;
                case 'refresh':
                    console.log('[Extension] 收到刷新消息');
                    vscode.commands.executeCommand('excelPlugin.refresh');
                    break;
                case 'headerRowChanged':
                    console.log(`[Extension] 收到表首行变化消息: ${data.headerRowIndex}`);
                    this._headerRowIndex = data.headerRowIndex;
                    // 调用回调函数通知外部
                    if (this._onHeaderRowChanged) {
                        this._onHeaderRowChanged(this._headerRowIndex);
                    }
                    break;
            }
        });
        // 初始加载数据
        setTimeout(() => this._sendData(), 100);
    }
    setData(data, filePath) {
        this._excelData = data;
        this._currentFile = filePath;
        console.log(`侧边栏设置数据: ${path.basename(filePath)}, ${data.headers.length} 列, ${data.rows.length} 行`);
    }
    clearData() {
        this._excelData = undefined;
        this._currentFile = '';
        this._currentRowIndex = -1;
        this._currentLineNumber = 0;
        this._formData = {};
        this._isFormEditing = false;
    }
    setExtensionActive(isActive) {
        this._isExtensionActive = isActive;
    }
    getHeaderRowIndex() {
        return this._headerRowIndex;
    }
    setHeaderRowIndex(index) {
        this._headerRowIndex = index;
    }
    refresh() {
        if (this._view) {
            if (this._excelData) {
                this._sendData();
            }
            else {
                this._sendEmptyData();
            }
        }
    }
    selectRow(rowData, rowIndex, lineNumber, forceUpdate = false) {
        if (this._isFormEditing && !forceUpdate) {
            return;
        }
        this._currentRowIndex = rowIndex;
        this._currentLineNumber = lineNumber;
        this._formData = { ...rowData };
        if (this._view) {
            this._view.webview.postMessage({
                type: 'selectRow',
                rowData: rowData,
                rowIndex: rowIndex,
                lineNumber: lineNumber
            });
        }
    }
    // 添加新方法：更新行统计信息
    updateLineStats(rowCount, currentLine) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'data',
                headers: this._excelData?.headers || [],
                currentFile: this._currentFile,
                rowCount: rowCount,
                currentLine: currentLine,
                isExtensionActive: this._isExtensionActive
            });
        }
    }
    clearForm() {
        this._currentRowIndex = -1;
        this._currentLineNumber = 0;
        this._formData = {};
        this._isFormEditing = false;
        if (this._view) {
            this._view.webview.postMessage({
                type: 'clearForm'
            });
        }
    }
    async getFormData() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'requestFormData'
            });
            return new Promise((resolve) => {
                const listener = this._view.webview.onDidReceiveMessage((data) => {
                    if (data.type === 'formDataResponse') {
                        listener.dispose();
                        resolve(data.formData);
                    }
                });
                setTimeout(() => {
                    listener.dispose();
                    resolve(this._formData);
                }, 5000);
            });
        }
        return this._formData;
    }
    _addRow(rowData) {
        if (!rowData || typeof rowData !== 'object') {
            console.error('行数据格式不正确');
            return;
        }
        this._formData = rowData;
        vscode.commands.executeCommand('excelPlugin.addRow');
    }
    _sendData() {
        if (!this._view || !this._excelData) {
            return;
        }
        const headers = this._excelData.headers;
        let rowCount = this._excelData.rows.length;
        let currentLine = this._currentLineNumber;
        // 如果当前有活动编辑器，获取实际的文档行数
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && this._currentFile && activeEditor.document.fileName === this._currentFile) {
            const documentLineCount = activeEditor.document.lineCount;
            // 编辑器中的总行数应该等于文档的总行数
            rowCount = documentLineCount;
            // 当前行号应该取自编辑器的当前光标位置
            if (activeEditor.selection && activeEditor.selection.active) {
                currentLine = activeEditor.selection.active.line + 1; // 转换为1-based行号
            }
        }
        else {
            // 没有活动编辑器时，使用内存中的数据行数（加表头行）
            rowCount = this._excelData.rows.length + 1; // +1 for header row
        }
        this._view.webview.postMessage({
            type: 'data',
            headers: headers,
            currentFile: this._currentFile,
            rowCount: rowCount,
            currentLine: currentLine,
            isExtensionActive: this._isExtensionActive
        });
    }
    _sendEmptyData() {
        if (!this._view) {
            return;
        }
        this._view.webview.postMessage({
            type: 'emptyData',
            isExtensionActive: this._isExtensionActive
        });
    }
    _sendFormData() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'formDataResponse',
                formData: this._formData
            });
        }
    }
    _getHtmlForWebview(webview, isExtensionActive) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview", "sidebar.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview", "sidebar.js"));
        const statusText = isExtensionActive ? '已激活' : '已关闭';
        const statusClass = isExtensionActive ? 'active' : 'inactive';
        const hotkeyText = 'Ctrl+0';
        return `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Excel编辑器</title>
      <link rel="stylesheet" href="${styleUri}">
    </head>
    <body>
      <div class="container">
        <div class="header-section">
          <div class="header-top">
            <div class="header-left">
              <h3>Excel编辑器</h3>
              <div class="status-container">
                <div class="status-indicator ${statusClass}" id="statusIndicator">
                  <span>${statusText}</span>
                  <span class="status-hotkey">${hotkeyText}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="file-info" id="fileInfo">
            未打开Excel文件
          </div>
          
          <div class="file-stats" id="fileStats">
            <span>行: 0</span>
            <span>列: 0</span>
            <span class="current-line">当前: 无</span>
          </div>
        </div>
        
        <div class="main-content" id="mainContent">
          <div class="form-container" id="formContainer" style="display: none;">
            <div class="header-row-selector">
              <label for="headerRowInput">表首行:</label>
              <input type="number" id="headerRowInput" min="1" class="header-row-input">
              <span class="header-row-hint">选择表格的表头行（1-<span id="totalRowCount">总行数</span>）</span>
            </div>
            <div class="form-scroll-container" id="formScrollContainer">
              <div id="formFields"></div>
            </div>
          </div>
          
          <div class="empty-state" id="emptyState">
            <div class="empty-icon">📊</div>
            <h3>Excel编辑器</h3>
            <p>打开一个Excel文件开始编辑</p>
            <div class="empty-actions">
              <button onclick="openExcel()" class="primary-btn" id="openExcelBtn">打开Excel文件</button>
              <p class="hint">支持 .xlsx, .xls, .xlsm, .xlsb 格式</p>
            </div>
          </div>
        </div>
        
        <div class="footer-section">
          <button class="add-row-btn" onclick="addRow()" id="addRowBtn">添加新行</button>
        </div>
      </div>
      
      <script src="${scriptUri}"></script>
    </body>
    </html>`;
    }
}
//# sourceMappingURL=extension.js.map