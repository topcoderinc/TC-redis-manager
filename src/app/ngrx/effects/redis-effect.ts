/**
 * the redis instance async functions
 */

import {Effect, Actions, ofType} from '@ngrx/effects';
import {of, Observable} from 'rxjs';
import {RedisService} from '../../services/redis.service';


import {RedisActions, FetchedTree, RedisConnect, ReqFetchTree, ReqRedisConnect} from '../actions/redis-actions';
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
          })
        );
      }
    )
  );

  /**
   * send fetch tree request to backend when dispatch "ReqFetchTree"
   * and when backend returned, dispatch data to "FetchedTree"
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
          })
        );
      }
    )
  );
}
