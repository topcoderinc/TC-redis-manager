/**
 * the redis instance async functions
 */

import {Effect, Actions, ofType} from '@ngrx/effects';
import {of, Observable} from 'rxjs';
import {RedisService} from '../../services/redis.service';


import {RedisActions, FetchedTree, RedisConnect, RedisConnectFailed, ReqFetchTree, ReqRedisConnect} from '../actions/redis-actions';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {Action} from '@ngrx/store';
import {UtilService} from '../../services/util.service';


@Injectable()
export class RedisEffect {
  constructor(private actions$: Actions,
              private util: UtilService,
              private redisService: RedisService) {
  }

  /**
   * send connect request to backend when dispatch "ReqRedisConnect"
   * and when backend returned, dispatch data to "RedisConnect"
   * when backend return error, dispatch to "RedisConnectFailed"
   */
  @Effect()
  connectRedis: Observable<Action> = this.actions$.pipe(
    ofType<ReqRedisConnect>(RedisActions.ReqRedisConnect),
    mergeMap(action => {
        return this.redisService.connect(action['payload'].instance).pipe(
          map(data => {
            if (action['payload'].scb) {
              action['payload'].scb(data);
            }
            return new RedisConnect(data);
          }),
          catchError(() => {
            if (action['payload'].fcb) {
              action['payload'].fcb(action['payload'].instance);
            }
            if (action['payload'].instance) {
              const id = action['payload'].instance.id;
              const host = action['payload'].instance.serverModel.name;
              const port = action['payload'].instance.serverModel.port;
              this.util.showMessage(`Fail to connect Redis server at ${host}:${port}.`);
              return of(new RedisConnectFailed({id}));
            }
          })
        );
      }
    )
  );

  /**
   * send fetch tree request to backend when dispatch "ReqFetchTree"
   * and when backend returned, dispatch data to "FetchedTree"
   * when backend return error, dispatch to "RedisConnectFailed"
   */
  @Effect()
  fetchTree: Observable<Action> = this.actions$.pipe(
    ofType<ReqFetchTree>(RedisActions.ReqFetchTree),
    mergeMap(action => {
        const id = action['payload'].id;
        return this.redisService.fetchTree({id}).pipe(
          map(data => {
            if (action['payload'].scb) {
              action['payload'].scb(data);
            }
            return new FetchedTree({id, data});
          }),
          catchError(() => {
            return of( new RedisConnectFailed({id}));
          })
        );
      }
    )
  );
}
