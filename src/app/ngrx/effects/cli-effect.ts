/**
 * the cli async effect function
 */
import {Effect, Actions, ofType} from '@ngrx/effects';
import {of, Observable} from 'rxjs';
import {RedisService} from '../../services/redis.service';

import {catchError, map, mergeMap} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {Action} from '@ngrx/store';
import {UtilService} from '../../services/util.service';
import {CliActions, AddCommand, CommandRunFinished} from '../actions/cli-actions';


@Injectable()
export class CliEffect {
  constructor(private actions$: Actions,
              private util: UtilService,
              private redisService: RedisService) {
  }

  /**
   * send command to backend when dispatch "AddCommand"
   * and when backend returned, dispatch data to "CommandRunFinished"
   */
  @Effect()
  addCommand: Observable<Action> = this.actions$.pipe(
    ofType<AddCommand>(CliActions.AddCommand),
    mergeMap(action => {
        return this.redisService.call(
          action['payload'].redisId,
          [action['payload'].command]).pipe(
          map(ret => {
            if (action['payload'].cb) {
              action['payload'].cb(false);
            }
            return new CommandRunFinished({
              result: ret[0],
              id: action['payload'].id,
              error: !(ret[0] && ret[0].toString() && ret[0].toString().toLowerCase().indexOf('err') < 0),
            });
          }),
          catchError((e) => {
            if (action['payload'].cb) {
              action['payload'].cb(true);
            }
            return of( new CommandRunFinished({
              id: action['payload'].id,
              result: [e.error && e.error.message ? e.error.message : 'failed'],
              error: true,
            }));
          })
        );
      }
    )
  );
}
