import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {RedisInstance} from '../../models/redis-instance';
import {RedisService} from '../../services/redis.service';

/**
 * a redis instance tree component
 */
@Component({
  selector: 'app-instance-tree',
  templateUrl: './instance-tree.component.html',
  styleUrls: ['./instance-tree.component.scss']
})
export class InstanceTreeComponent implements OnInit {
  @Input() instance: RedisInstance = null;
  @Output() updatePage = new EventEmitter();
  public selectedMap = {};
  public expandedMap = {};

  constructor(private redisService: RedisService) {
  }

  /**
   * on redis expand
   */
  onExpand() {
    if (this.instance.expanded) {
      this.instance.expanded = false;
      return;
    }
    this.instance.working = true;
    this.redisService.fetchTree({id: this.instance.id}).subscribe(ret => {
      this.instance.working = false;
      this.instance.expanded = true;
      this.instance.children = ret;
    }, e => {
      this.instance.status = 'failed';
      this.instance.working = false;
    });
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


  ngOnInit() {
  }
}
