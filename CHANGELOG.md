# Change Log


## [1.0.2] - 2026-02-06

### Added
- 引入同步协调器（SyncCoordinator）架构，实现模块化的同步处理器
- 集成智能防抖系统（SmartDebouncer），优化输入体验
- 添加"当前行"输入框，支持快速导航到指定行
- 添加智能列数计算，所有行的最大列，确保数据完整性
- 添加同步配置管理器（SyncConfigManager），支持灵活的同步配置
- 添加多个同步处理器，支持不同场景的同步需求：
  - `CurrentRowInputToCursorSyncHandler` - 当前行输入框到光标同步
  - `CursorRowToCurrentRowInputSyncHandler` - 光标到当前行输入框同步
  - `EditorToFormSyncHandler_LessThan` - 编辑器到表单同步（小于表头行）
  - `EditorToFormSyncHandler_Equal` - 编辑器到表单同步（等于表头行）
  - `EditorToFormSyncHandler_GreaterThan` - 编辑器到表单同步（大于表头行）
  - `FormToHeaderSyncHandler` - 表单到表头同步
  - `HeaderToFormSyncHandler` - 表头到表单同步

### Changed
- 重构项目架构，采用模块化设计
- 将"表首行"名称修改为"表头行"
- 优化"表头行"和"当前行"输入框的输入验证：
  - 输入框为空时自动设置为 "1"
  - 输入值大于总行数时自动调整为总行数
  - 最大值限制为编辑器中 Excel 文件的总行数
- 优化编辑表单输入框同步光标所在行的逻辑，使用同步器实现

### Fixed
- 修复设置项切换插件激活状态功能失效问题
- 修复底部状态栏切换插件激活状态功能失效问题
- 修复快捷键切换插件激活状态功能失效问题
- 修复已激活状态下关闭再打开插件窗口功能失效问题
- 修复因重构导致的其他功能失效问题
- 修复表单数据与编辑器数据不一致的问题
- 修复内存数据与编辑器同步的问题

### Improved
- 提升数据同步的稳定性和可靠性
- 优化输入防抖机制，支持动态调整防抖时间
- 改进表单项输入框的自动调整功能，提供更好的编辑体验

## [1.0.1] - 2026-01-21

### Added
- 添加表首行功能
- 实现表首行输入框，支持自定义表头行位置
- 实现表首行输入框改变表单项名称功能
- 支持根据表首行自动渲染表单项名称

### Changed
- 优化表头数据解析逻辑
- 改进表单项名称的渲染机制

## [1.0.0] - 2026-01-12

### Added
- 初始版本发布
- 实现基础的 Excel 文件编辑功能
- 支持在 VS Code 中编辑 Excel 文件（.xlsx, .xls, .xlsm, .xlsb）
- 支持在 VS Code 中编辑文本文件（.csv, .tsv）
- 实现侧边栏视图，用于显示和编辑 Excel 内容
- 实现表单与编辑器的双向数据同步
- 实现实时数据同步功能
- 支持添加新行功能
- 支持更新单元格数据功能
- 支持激活/停用插件状态
- 添加快捷键支持（Ctrl+0 / Cmd+0）
- 添加启动激活配置选项（excelPlugin.activateOnStart）
- 实现状态栏显示和交互
- 支持表单项输入框自动调整大小


[releases]: https://github.com/JoyousCode/excel-plugin/releases
[1.0.2]: https://github.com/JoyousCode/excel-plugin/releases/tag/1.0.2
[1.0.1]: https://github.com/JoyousCode/excel-plugin/releases/tag/1.0.1
[1.0.0]: https://github.com/JoyousCode/excel-plugin/releases/tag/1.0.0
