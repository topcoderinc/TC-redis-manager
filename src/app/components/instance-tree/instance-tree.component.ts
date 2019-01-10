import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {RedisInstance} from '../../models/redis-instance';
import {RedisService} from '../../services/redis.service';
import {Store} from '@ngrx/store';
import {ReqFetchTree, ToggleRedis} from '../../ngrx/actions/redis-actions';

/**
 * a redis instance tree component
 */
@Component({
  selector: 'app-instance-tree',
  templateUrl: './instance-tree.component.html',
  styleUrls: ['./instance-tree.component.scss']
})
export class InstanceTreeComponent implements OnInit {
  @Input() instance: RedisInstance;
  @Input() expandDeep: Subject<void>;
  @Input() isActive = false;
  @Output() updatePage = new EventEmitter();
  public selectedMap = {};
  public expandedMap = {};

  constructor(private redisService: RedisService, private _store: Store<any>) {
  }

  /**
   * on redis expand
   */
  onExpand() {
    const id = this.instance.id;
    if (this.instance.expanded) {
      this._store.dispatch(new ToggleRedis({id}));
      return;
    }
    this._store.dispatch(new ReqFetchTree({id}));
    this._store.dispatch(new ToggleRedis({id}));
  }

  /**
   * on redis instance root item click
   */
  onClickRootItem() {
    this.selectedMap = {};
    this.updatePage.emit({
      type: 'root-instance',
      id: this.instance.id,
    });
  }

  /**
   * on item click
   * @param item the data item
   */
  onClickItem(item) {
    this.selectedMap = {};
    this.selectedMap[item.key + item.type] = true;
    this.updatePage.emit({
      type: 'data-viewer',
      id: this.instance.id,
      item: item,
    });
  }

  deepExpandItem(item) {
    this.expandedMap[item.key] = true;
    if (item.children) {
      item.children.forEach(child => { this.deepExpandItem(child); });
    }
  }

  ngOnInit() {
    this.expandDeep.subscribe(() => {
      if (!this.instance.children) {
        return;
      }
      this.instance.children.forEach(item => {
        if (item.children) {
          this.deepExpandItem(item);
        }
      });
    });
  }
}
