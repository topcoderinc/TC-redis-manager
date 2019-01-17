/**
 * the redis reducer
 */
import uuid from 'uuid';
import {RedisActions} from '../actions/redis-actions';
import {RedisInstance} from '../../models/redis-instance';
import _ from 'lodash';

export const REDIS_INSTANCES_KEY = 'REDIS_INSTANCES_KEY';
const defaultState = [{serverModel: {name: 'default-local', ip: 'localhost', port: 6379, db: 0, password: ''}, id: uuid()}];
let initState = defaultState;


/**
 * read redis server from localStorage
 */
function initLocalInstance() {
  const instanceString = localStorage.getItem(REDIS_INSTANCES_KEY);
  let newState = [];
  if (!instanceString) {
    newState = [];
  } else {
    try {
      newState = JSON.parse(instanceString);
    } catch (e) {
      newState = [];
    }
  }
  if (!newState || newState.length <= 0) {
    initState = defaultState;
  } else {
    initState = newState;
  }
}

/**
 * save redis instance state from server
 */
function saveInstanceToLocalStorage(state) {
  const savedState = [];
  for (let i = 0; i < state.length; i++) {
    const instance = _.omit(_.clone(state[i]), 'children');
    savedState.push(instance);
    instance.expanded = false;
    instance.selected = false;
    instance.status = null;
  }
  localStorage.setItem(REDIS_INSTANCES_KEY, JSON.stringify(savedState));
}


initLocalInstance();
saveInstanceToLocalStorage(initState); // save it


/**
 * default instance
 */
// @ts-ignore
export const initialState: [RedisInstance] = initState;

const getInstanceById = (id, state) => state.find(ins => ins.id === id) || {};

export function reducer(state = initialState, action) {
  switch (action.type) {
    case RedisActions.ReqRedisConnect: {
      if (action.payload.instance) {
        const i = getInstanceById(action.payload.instance.id, state);
        i.status = 'connecting';
        i.working = true;
      }
      return state;
    }
    case RedisActions.RedisConnectFailed: {
      const i = getInstanceById(action.payload.id, state);
      i.status = 'failed';
      i.working = false;
      i.selected = false;
      i.expanded = false;
      return state;
    }
    case RedisActions.RedisConnect: {
      const i = getInstanceById(action.payload.id, state);
      i.status = 'connected';
      i.working = false;
      return state;
    }
    case RedisActions.DisconnectAllRedis: {
      state.forEach(r => r.selected = false);
      return state;
    }
    case RedisActions.SelectRedis: {
      const i = getInstanceById(action.payload.id, state);
      i.selected = true;
      return state;
    }
    case RedisActions.RedisDisconnect: {
      const i = getInstanceById(action.payload.id, state);
      i.expanded = false;
      i.status = null;
      i.selected = false;
      return state;
    }

    case RedisActions.ReqFetchTree: {
      const i = getInstanceById(action.payload.id, state);
      i.working = true;
      return state;
    }
    case RedisActions.FetchedTree: {
      const i = getInstanceById(action.payload.id, state);
      i.children = action.payload.data;
      i.working = false;
      return state;
    }
    case RedisActions.ToggleRedis: {
      const i = getInstanceById(action.payload.id, state);
      i.expanded = !i.expanded;
      return state;
    }
    case RedisActions.RemoveRedisServer: {
      const newState = state.filter(i => i.id !== action.payload.instance.id);
      saveInstanceToLocalStorage(newState);
      return newState;
    }

    case RedisActions.AddRedisServer: {
      state.push(action.payload);
      saveInstanceToLocalStorage(state);
      return state;
    }
    default: {
      return state;
    }
  }
}
