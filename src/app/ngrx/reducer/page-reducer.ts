/**
 * the page reducer
 */
import actions from '../actions/page-actions';
import {PageModel} from '../../models/page-model';


// @ts-ignore
export const initialState: PageModel = {};


export function reducer(state = initialState, action) {
  switch (action.type) {
    case actions.REQ_LOAD_ROOT_PAGE: {
      return action.payload;
    }
    case actions.REQ_LOAD_PAGE: {
      return action.payload;
    }
    case actions.LOADED_PAGE: {
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
