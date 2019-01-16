/**
 * the page async effect functions
 */
import {Effect, Actions, ofType} from '@ngrx/effects';
import {of, Observable} from 'rxjs';
import {RedisService} from '../../services/redis.service';


import {PageActions, LoadedPage, ReqLoadRootPage} from '../actions/page-actions';
import {RedisConnectFailed} from '../actions/redis-actions';

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
   * send command to backend when dispatch "ReqLoadRootPage"
   * and when backend returned, dispatch data to "LoadedPage"
   */
  @Effect()
  pageLoad: Observable<Action> = this.actions$.pipe(
    ofType<ReqLoadRootPage>(PageActions.ReqLoadRootPage),
    mergeMap(action => {
        return this.redisService.call(
          action['payload'].id,
          [['info']]).pipe(
          map(ret => {
            if (!ret[0].error) {
              const rawInfo = ret[0].result;
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
              return new LoadedPage({
                item: result,
                requestId: action['payload'].requestId,
                id: action['payload'].id
              });
            } else {
              this.util.showMessage('Failed to load instance.');
            }
          }),
          catchError(() => {
            const id = action['payload'].id;
            return of( new RedisConnectFailed({id}));
          })
        );
      }
    )
  );
}
