/**
 * the redis instance actions
 */
import {Action} from '@ngrx/store';

export enum RedisActions {
  ReqRedisConnect = 'Req Redis Connect', // request to connect a redis
  RedisConnect = 'Redis Connect', // when a redis instance connected
  RedisConnectFailed = 'Redis Connect Failed', // when a redis instance connect failed
  RedisDisconnect = 'Redis Disconnect', // disconnect a redis
  DisconnectAllRedis = 'Disconnect All Redis', // de selected all redis instance
  SelectRedis = 'Select Redis', // select a redis instance
  ReqFetchTree = 'Req Fetch Tree', // request to fetch a redis instance tree node
  FetchedTree = 'Fetched Tree', // when fetch tree finished
  ToggleRedis = 'Toggle Redis', // toggle redis instance
  AddRedisServer = 'Add Redis Server', // add redis server
  RemoveRedisServer = 'Remove Redis Server' // delete redis server
}

export class ReqRedisConnect implements Action {
  readonly type = RedisActions.ReqRedisConnect;

  constructor(public payload: any) { }
}

export class RedisConnect implements Action {
  readonly type = RedisActions.RedisConnect;

  constructor(public payload: any) { }
}

export class RedisConnectFailed implements Action {
  readonly type = RedisActions.RedisConnectFailed;

  constructor(public payload: any) { }
}

export class RedisDisconnect implements Action {
  readonly type = RedisActions.RedisDisconnect;

  constructor(public payload: any) { }
}

export class DisconnectAllRedis implements Action {
  readonly type = RedisActions.DisconnectAllRedis;
}

export class SelectRedis implements Action {
  readonly type = RedisActions.SelectRedis;

  constructor(public payload: any) { }
}

export class ReqFetchTree implements Action {
  readonly type = RedisActions.ReqFetchTree;

  constructor(public payload: any) { }
}

export class FetchedTree implements Action {
  readonly type = RedisActions.FetchedTree;

  constructor(public payload: any) { }
}

export class ToggleRedis implements Action {
  readonly type = RedisActions.ToggleRedis;

  constructor(public payload: any) { }
}

export class AddRedisServer implements Action {
  readonly type = RedisActions.AddRedisServer;

  constructor(public payload: any) { }
}

export class RemoveRedisServer implements Action {
  readonly type = RedisActions.RemoveRedisServer;

  constructor(public payload: any) { }
}
