import {Injectable} from '@angular/core';
import {Observable, throwError, of} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import * as _ from 'lodash';
import {environment} from '../../environments/environment';
import {catchError, delay} from 'rxjs/operators';
import {Store} from '@ngrx/store';

import {RedisConnectFailed} from '../ngrx/actions/redis-actions';
import {REDIS_INSTANCES_KEY} from '../ngrx/reducer/redis-reducer';
import {UtilService} from './util.service';

export const API_BASE_URL = environment.URI;

@Injectable({
  providedIn: 'root'
})

export class HttpHelperService {
  constructor(
    private http: HttpClient,
    private util: UtilService,
    private _store: Store<any>
  ) { }

  /**
   * Performs a request with `get` http method.
   * @param url the url
   * @param options the request options
   * @returns {Observable<any>}
   */
  get(url: string, options?: any): Observable<any> {
    return this.http
      .get(API_BASE_URL + url, this.requestOptions(options))
      .pipe(delay(1000), catchError(err => this.catchError(err)));
  }

  /**
   * Performs a request with `post` http method.
   * @param url the url
   * @param body the body
   * @param options the request options
   * @param isUpload the flag if the request is made for upload
   * @returns {Observable<any>}
   */
  post(url: string, body: any, options?: any, isUpload?: boolean): Observable<any> {
    return this.http
      .post(API_BASE_URL + url, body, this.requestOptions(options, isUpload))
      .pipe(delay(1000), catchError(err => this.catchError(err)));
  }

  /**
   * catches the auth error
   * @param error the error response
   */
  catchError(error: any): Observable<any> {
    const err = error.error;
    if (err.code === 500) {
      const instancesString = localStorage.getItem(REDIS_INSTANCES_KEY);
      const instances = instancesString ? JSON.parse(instancesString) : [];
      const instance = _.find(instances, {'id': err.instanceId});console.log('dsadas');console.log(instance);
      if (instance) {
        const id = instance.id;
        const host = instance.serverModel.name;
        const port = instance.serverModel.port;
        this.util.showMessage(`Fail to connect Redis server at ${host}:${port}.`);
        this._store.dispatch(new RedisConnectFailed({id}));
      }
    }
    return throwError(error);
  }

  /**
   * Request options.
   * @param options
   * @param isUpload the flag if the request is made for upload
   * @returns {RequestOptionsArgs}
   */
  private requestOptions(options?: any, isUpload?: boolean): any {
    if (options == null) {
      options = {};
    }

    if (options.headers == null) {
      options.headers = new HttpHeaders();
    }
    options.headers = options.headers.set('If-Modified-Since', 'Mon, 26 Jul 1997 05:00:00 GMT');

    if (options.params != null) {
      if (!_.isString(options.params)) {
        _.forEach(options.params, (value, key) => {
          if (_.isNil(value) || (_.isString(value) && value.length === 0)) {
            delete options.params[key];
          }
        });
      }
    }
    return options;
  }
}
