/**
 * the page reducer
 */
import {PageActions} from '../actions/page-actions';
import {PageModel} from '../../models/page-model';


// @ts-ignore
export const initialState: PageModel = {};


export function reducer(state = initialState, action) {
  switch (action.type) {
    case PageActions.ReqLoadRootPage: {
      return action.payload;
    }
    case PageActions.ReqLoadPage: {
      return action.payload;
    }
    case PageActions.LoadedPage: {
      if (state.id === action.payload.id && state.requestId === action.payload.requestId) { // same page
        state.item = action.payload.item;
        state.loading = false;
      }
      return state;
    }
    default: {
      return state;
    }
  }
}
