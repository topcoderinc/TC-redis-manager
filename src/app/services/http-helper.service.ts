import {Injectable} from '@angular/core';
import {Observable, throwError, of} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import * as _ from 'lodash';
import {environment} from '../../environments/environment';
import {catchError} from 'rxjs/operators';

const API_BASE_URL = environment.URI;

@Injectable({
  providedIn: 'root'
})

export class HttpHelperService {
  constructor(private http: HttpClient) {
  }

  /**
   * Performs a request with `get` http method.
   * @param url the url
   * @param options the request options
   * @returns {Observable<any>}
   */
  get(url: string, options?: any): Observable<any> {
    return this.http
      .get(API_BASE_URL + url, this.requestOptions(options))
      .pipe(catchError(err => this.catchError(err)));
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
      .pipe(catchError(err => this.catchError(err)));
  }

  /**
   * Performs a request with `put` http method.
   * @param url the url
   * @param body the body
   * @param options the request options
   * @returns {Observable<any>}
   */
  put(url: string, body?: any, options?: any, isUpload?: boolean): Observable<any> {
    return this.http
      .put(API_BASE_URL + url, body, this.requestOptions(options, isUpload))
      .pipe(catchError(err => this.catchError(err)));
  }

  /**
   * Performs a request with `put` http method.
   * @param url the url
   * @param body the body
   * @param options the request options
   * @returns {Observable<any>}
   */
  patch(url: string, body?: any, options?: any, isUpload?: boolean): Observable<any> {
    return this.http
      .patch(API_BASE_URL + url, body, this.requestOptions(options, isUpload))
      .pipe(catchError(err => this.catchError(err)));
  }

  /**
   * Performs a request with `delete` http method.
   * @param url the url
   * @param options the request options
   * @returns {Observable<any>}
   */
  delete(url: string, options?: any): Observable<any> {
    return this.http.delete(API_BASE_URL + url, this.requestOptions(options))
      .pipe(catchError(err => this.catchError(err)));
  }


  /**
   * catches the auth error
   * @param error the error response
   */
  catchError(error: Response): Observable<Response> {
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
