import {AddServerModel} from './add-server-model';

/**
 * redis instance model
 */
export class RedisInstance {
  status = 'new';
  working = false;
  serverModel: AddServerModel;
  id = '';
  selected = false;
  expanded = false;
  children = [];
  rootInfo = {};
}
