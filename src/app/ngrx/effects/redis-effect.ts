/**
 * the redis instance async functions
 */

import {Effect, Actions, ofType} from '@ngrx/effects';
import {of, Observable} from 'rxjs';
import {RedisService} from '../../services/redis.service';


import {FETCHED_TREE, REDIS_CONNECT, REDIS_CONNECT_FAILED, REQ_FETCH_TREE, REQ_REDIS_CONNECT} from '../actions/redis-actions';
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
   * send connect request to backend when dispatch "REQ_REDIS_CONNECT"
   * and when backend returned, dispatch data to "REDIS_CONNECT"
   * when backend return error, dispatch to "REDIS_CONNECT_FAILED"
   */
  @Effect()
  connectRedis: Observable<Action> = this.actions$.pipe(
    ofType(REQ_REDIS_CONNECT),
    mergeMap(action => {
        return this.redisService.connect(action['payload'].instance).pipe(
          map(data => {
            if (action['payload'].scb) {
              action['payload'].scb(data);
            }
            return {type: REDIS_CONNECT, payload: data};
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
              return of({type: REDIS_CONNECT_FAILED, payload: {id}});
            }
          })
        );
      }
    )
  );

  /**
   * send fetch tree request to backend when dispatch "REQ_FETCH_TREE"
   * and when backend returned, dispatch data to "FETCHED_TREE"
   * when backend return error, dispatch to "REDIS_CONNECT_FAILED"
   */
  @Effect()
  fetchTree: Observable<Action> = this.actions$.pipe(
    ofType(REQ_FETCH_TREE),
    mergeMap(action => {
        const id = action['payload'].id;
        return this.redisService.fetchTree({id}).pipe(
          map(data => {
            if (action['payload'].scb) {
              action['payload'].scb(data);
            }
            return {type: FETCHED_TREE, payload: {id, data}};
          }),
          catchError(() => {
            return of({type: REDIS_CONNECT_FAILED, payload: {id}});
          })
        );
      }
    )
  );
}
