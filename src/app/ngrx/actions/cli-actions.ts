/**
 * the cli actions
 */
import {Action} from '@ngrx/store';

export enum CliActions {
  AddCommand = 'Add Command', // when user enter command and press enter key
  CommandRunFinished = 'Command Run Finished', // when command send to server and returned result
  ClearHistory = 'Clear History', // clear all cli history
  ToggleCli = 'Toggle Cli', // toggle cli panel
  ClearPreviewIndex = 'Clear Preview Index', // clear preview index
  PreviewIndexUpdate = 'Preview Index Update' // update preview index
}

export class AddCommand implements Action {
  readonly type = CliActions.AddCommand;

  constructor(public payload: any) { }
}

export class CommandRunFinished implements Action {
  readonly type = CliActions.CommandRunFinished;

  constructor(public payload: any) { }
}

export class ClearHistory implements Action {
  readonly type = CliActions.ClearHistory;
}

export class ToggleCli implements Action {
  readonly type = CliActions.ToggleCli;
}

export class PreviewIndexUpdate implements Action {
  readonly type = CliActions.PreviewIndexUpdate;

  constructor(public payload: any) { }
}

export class ClearPreviewIndex implements Action {
  readonly type = CliActions.ClearPreviewIndex;

  constructor(public payload: any) { }
}
