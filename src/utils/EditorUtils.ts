import * as vscode from 'vscode';

/**
 * 编辑器工具类
 * 提供处理编辑器光标位置和滚动的方法
 */
export class EditorUtils {
  /**
   * 将编辑器光标放到指定行的最前面，并滚动编辑器窗口显示该行
   * @param lineNumber 指定的行号（从1开始）
   * @param editor 可选的编辑器实例，如果不提供则使用当前活动编辑器
   */
  public static async gotoLine(lineNumber: number, editor?: vscode.TextEditor): Promise<void> {
    console.log(`[EditorUtils] 接收到行号: ${lineNumber}`);
    
    // 获取编辑器实例
    const targetEditor = editor || vscode.window.activeTextEditor;
    if (!targetEditor) {
      console.warn('[EditorUtils] 没有活动编辑器');
      return;
    }

    // 计算0-based的行索引
    const lineIndex = lineNumber - 1;
    
    // 创建新的光标位置（行的最前面）
    const position = new vscode.Position(lineIndex, 0);
    
    // 创建新的选择
    const selection = new vscode.Selection(position, position);
    
    // 更新编辑器的选择
    targetEditor.selection = selection;
    
    // 滚动编辑器窗口以显示该行
    await targetEditor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenterIfOutsideViewport
    );
    
    console.log(`[EditorUtils] 光标已移动到第 ${lineNumber} 行`);
  }
}
