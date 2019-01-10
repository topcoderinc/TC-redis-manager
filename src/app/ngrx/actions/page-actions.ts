/**
 * the right page actions
 */
import {Action} from '@ngrx/store';

import {PageModel} from '../../models/page-model';


export enum PageActions {
  ReqLoadPage = 'Req Load Page', // request to load new date viewer page
  LoadedPage = 'Loaded Page', // page loaded
  ReqLoadRootPage = 'Req Load Root Page' // request to load root page
}

export class ReqLoadPage implements Action {
  readonly type = PageActions.ReqLoadPage;

  constructor(public payload: any) { }
}

export class LoadedPage implements Action {
  readonly type = PageActions.LoadedPage;

  constructor(public payload: any) { }
}

export class ReqLoadRootPage implements Action {
  readonly type = PageActions.ReqLoadRootPage;

  constructor(public payload: PageModel) { }
}
