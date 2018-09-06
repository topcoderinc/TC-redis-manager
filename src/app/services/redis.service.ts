import {Injectable} from '@angular/core';
import {HttpHelperService} from './http-helper.service';

/**
 * redis endpoint services
 */
@Injectable({
  providedIn: 'root'
})
export class RedisService {
  constructor(private httpHelper: HttpHelperService) {
  }

  /**
   * connect a redis server
   * @param body the request body
   */
  public connect(body) {
    return this.httpHelper.post('/redis/connect', body);
  }


  /**
   * fetch redis instance tree by id
   * @param query the query
   */
  public fetchTree(query) {
    const options = {
      params: query
    };
    return this.httpHelper.get('/redis/fetch', options);
  }

  /**
   * run raw commands to redis server
   * @param id the id
   * @param lines the raw lines
   */
  public call(id, lines) {
    return this.httpHelper.post(`/redis/call?id=${id}`, {lines});
  }
}
