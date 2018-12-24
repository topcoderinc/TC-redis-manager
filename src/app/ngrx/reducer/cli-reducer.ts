/**
 * the cli reducer
 */
import actions from '../actions/cli-actions';


// @ts-ignore
export const initialState = {
  expanded: false,
  items: [],
};

const getItemById = (id, state) => state.items.find(i => i.id === id);
const errorSuffixString = ', with args beginning with: ';

export function reducer(state = initialState, action) {
  switch (action.type) {
    case actions.ADD_COMMAND: {
      state.items.push(action.payload.item);
      return state;
    }
    case actions.COMMAND_RUN_FINISHED: {
      const id = action.payload.id;
      const i = getItemById(id, state);
      if (action.payload.result instanceof Array) {
        i.result = action.payload.result.map(res => {
          return res.endsWith(errorSuffixString) ? res.slice(0, -errorSuffixString.length) : res;
        });
      } else {
        i.result = action.payload.result;
      }
      console.log(i.result);
      i.status = 'end';
      i.error = action.payload.error;
      return state;
    }
    case actions.CLEAR_HISTORY: {
      // clear all, and only keep un completed command
      state.items = state.items.filter(i => i.status === 'new');
      return state;
    }
    case actions.TOGGLE_CLI: {
      state.expanded = !state.expanded;
      return state;
    }
    default: {
      return state;
    }
  }
}
