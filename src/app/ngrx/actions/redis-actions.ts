/**
 * the redis instance actions
 */
export const REQ_REDIS_CONNECT = 'REQ_REDIS_CONNECT'; // request to connect a redis
export const REDIS_CONNECT = 'REDIS_CONNECT'; // when a redis instance connected
export const REDIS_CONNECT_FAILED = 'REDIS_CONNECT_FAILED'; // when a redis instance connect failed
export const REDIS_DISCONNECT = 'REDIS_DISCONNECT'; // disconnect a redis
export const DESELECT_ALL_REDIS = 'DESELECT_ALL_REDIS'; // de selected all redis instance
export const SELECT_REDIS = 'SELECT_REDIS'; // select a redis instance
export const REQ_FETCH_TREE = 'REQ_FETCH_TREE'; // request to fetch a redis instance tree node
export const FETCHED_TREE = 'FETCHED_TREE'; // when fetch tree finished
export const TOGGLE_REDIS = 'TOGGLE_REDIS'; // toggle redis instance
export const ADD_REDIS_SERVER = 'ADD_REDIS_SERVER'; // add redis server

export default {
  REQ_REDIS_CONNECT,
  REDIS_CONNECT,
  REDIS_CONNECT_FAILED,

  REDIS_DISCONNECT,
  SELECT_REDIS,
  DESELECT_ALL_REDIS,
  REQ_FETCH_TREE,
  FETCHED_TREE,
  TOGGLE_REDIS,
  ADD_REDIS_SERVER,
};
