/**
 * the cli reducer
 */
import {CliActions} from '../actions/cli-actions';

const DEFAULT_PREVIEW_INDEX = -1;

// @ts-ignore
export const initialState = {
  expanded: false,
  items: [],
  previousIndex: DEFAULT_PREVIEW_INDEX,
};

const getItemById = (id, state) => state.items.find(i => i.id === id);
const errorSuffixString = ', with args beginning with: ';

export function reducer(state = initialState, action) {
  switch (action.type) {
    case CliActions.AddCommand: {
      state.items.push(action.payload.item);
      state.previousIndex = DEFAULT_PREVIEW_INDEX;
      return state;
    }
    case CliActions.CommandRunFinished: {
      const id = action.payload.id;
      const i = getItemById(id, state);
      if (action.payload.result instanceof Array) {
        i.result = action.payload.result.map(res => {
          return res.endsWith(errorSuffixString) ? res.slice(0, -errorSuffixString.length) : res;
        });
      } else {
        i.result = action.payload.result;
      }
      i.status = 'end';
      i.error = action.payload.error;
      return state;
    }
    case CliActions.ClearHistory: {
      // clear all, and only keep un completed command
      state.items = state.items.filter(i => i.status === 'new');
      return state;
    }
    case CliActions.ClearPreviewIndex: {
      state.previousIndex = DEFAULT_PREVIEW_INDEX;
      return state;
    }
    case CliActions.PreviewIndexUpdate: {
      state.previousIndex = action.payload.index;
      return state;
    }
    case CliActions.ToggleCli: {
      state.expanded = !state.expanded;
      return state;
    }
    default: {
      return state;
    }
  }
}
