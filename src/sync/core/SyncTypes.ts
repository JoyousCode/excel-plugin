import * as vscode from 'vscode';

export interface SyncEvent {
  type: string;
  timestamp: number;
  source: 'editor' | 'form' | 'system';
}

export interface HeaderChangeEvent extends SyncEvent {
  type: 'headerChange';
  headers: string[];
  headerRowIndex: number;
}

export interface EditorChangeEvent extends SyncEvent {
  type: 'editorChange';
  editor: vscode.TextEditor;
  headers: string[];
  headerRowIndex: number;
  cursorRowIndex: number;
  totalColumns?: number;
  totalLines?: number;
  isEditingForm: boolean;
  isEditorChangeFromExtension: boolean;
}

export interface FormChangeEvent extends SyncEvent {
  type: 'formChange';
  editor: vscode.TextEditor;
  headers: string[];
  headerRowIndex: number;
  cursorRowIndex: number;
  rowIndex: number;
  column: string;
  value: string;
  isEditingForm: boolean;
  isEditorChangeFromExtension: boolean;
}

export interface CursorRowChangeEvent extends SyncEvent {
  type: 'cursorRowChange';
  editor: vscode.TextEditor;
  cursorRowIndex: number;
  isEditingForm: boolean;
}

export interface CurrentRowInputChangeEvent extends SyncEvent {
  type: 'currentRowInputChange';
  editor: vscode.TextEditor;
  headers: string[];
  headerRowIndex: number;
  currentRowInputValue: number;
  isUpdatingFromExtension: boolean;
}

export interface CurrentRowInputToCursorEvent extends SyncEvent {
  type: 'currentRowInputToCursor';
  editor: vscode.TextEditor;
  currentRowValue: number;
  isUpdatingFromExtension: boolean;
}

export type SyncEventData = 
  | HeaderChangeEvent 
  | EditorChangeEvent 
  | FormChangeEvent 
  | CursorRowChangeEvent 
  | CurrentRowInputChangeEvent 
  | CurrentRowInputToCursorEvent;

export interface SyncHandler {
  readonly name: string;
  readonly enabled: boolean;
  canHandle(event: SyncEventData): boolean;
  handle(event: SyncEventData): Promise<void> | void;
  dispose(): void;
}

export interface SyncHandlerConfig {
  enabled: boolean;
  priority: number;
  debounceMs?: number;
}

export interface SyncHandlerOptions {
  sidebarProvider: any;
  config: SyncHandlerConfig;
}

export interface ISyncCoordinator {
  registerHandler(handler: SyncHandler): void;
  unregisterHandler(handlerName: string): void;
  emit(event: SyncEventData): Promise<void>;
  dispose(): void;
}
