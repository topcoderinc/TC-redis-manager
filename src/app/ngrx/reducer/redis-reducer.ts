/**
 * the redis reducer
 */
import uuid from 'uuid';
import actions from '../actions/redis-actions';
import {RedisInstance} from '../../models/redis-instance';


/**
 * default instance
 */
// @ts-ignore
export const initialState: [RedisInstance]
  = [{serverModel: {name: 'default-local', ip: 'localhost', port: 6379, db: 0, password: ''}, id: uuid()}];

const getInstanceById = (id, state) => state.find(ins => ins.id === id) || {};

export function reducer(state = initialState, action) {
  switch (action.type) {
    case actions.REQ_REDIS_CONNECT: {
      const i = getInstanceById(action.payload.instance.id, state);
      i.status = 'connecting';
      i.working = true;
      return state;
    }
    case actions.REDIS_CONNECT_FAILED: {
      const i = getInstanceById(action.payload.id, state);
      i.status = 'failed';
      i.working = false;
      return state;
    }
    case actions.REDIS_CONNECT: {
      const i = getInstanceById(action.payload.id, state);
      i.status = 'connected';
      i.working = false;
      return state;
    }
    case actions.DESELECT_ALL_REDIS: {
      state.forEach(r => r.selected = false);
      return state;
    }
    case actions.SELECT_REDIS: {
      const i = getInstanceById(action.payload.id, state);
      i.selected = true;
      return state;
    }
    case actions.REDIS_DISCONNECT: {
      const i = getInstanceById(action.payload.id, state);
      i.expanded = false;
      i.status = null;
      i.selected = false;
      return state;
    }

    case actions.REQ_FETCH_TREE: {
      const i = getInstanceById(action.payload.id, state);
      i.working = true;
      return state;
    }
    case actions.FETCHED_TREE: {
      const i = getInstanceById(action.payload.id, state);
      i.children = action.payload.data;
      i.working = false;
      return state;
    }
    case actions.TOGGLE_REDIS: {
      const i = getInstanceById(action.payload.id, state);
      i.expanded = !i.expanded;
      return state;
    }

    case actions.ADD_REDIS_SERVER: {
      state.push(action.payload);
      return state;
    }
    default: {
      return state;
    }
  }
}
