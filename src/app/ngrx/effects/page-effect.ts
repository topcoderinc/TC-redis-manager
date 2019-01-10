/**
 * the page async effect functions
 */
import {Effect, Actions, ofType} from '@ngrx/effects';
import {of, Observable} from 'rxjs';
import {RedisService} from '../../services/redis.service';


import {LOADED_PAGE, REQ_LOAD_ROOT_PAGE} from '../actions/page-actions';
import {REDIS_CONNECT_FAILED} from '../actions/redis-actions';

import {catchError, map, mergeMap} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {Action} from '@ngrx/store';
import {UtilService} from '../../services/util.service';


@Injectable()
export class PageEffect {
  constructor(private actions$: Actions,
              private util: UtilService,
              private redisService: RedisService) {
  }

  /**
   * send command to backend when dispatch "REQ_LOAD_ROOT_PAGE"
   * and when backend returned, dispatch data to "LOADED_PAGE"
   */
  @Effect()
  pageLoad: Observable<Action> = this.actions$.pipe(
    ofType(REQ_LOAD_ROOT_PAGE),
    mergeMap(action => {
        return this.redisService.call(
          action['payload'].id,
          [['info']]).pipe(
          map(ret => {
            const rawInfo = ret[0];
            const result = [];
            rawInfo.split('\n').forEach(line => {
              if (line.indexOf('#') === 0) {
                return;
              }
              if (line.trim() === '') {
                return;
              }
              const parts = line.split(':');
              result.push({
                key: parts[0].split('_').join(' '),
                value: parts[1],
              });
            });
            return {type: LOADED_PAGE, payload: {item: result, requestId: action['payload'].requestId, id: action['payload'].id}};
          }),
          catchError(() => {
            const id = action['payload'].id;
            return of({type: REDIS_CONNECT_FAILED, payload: {id}});
          })
        );
      }
    )
  );
}
