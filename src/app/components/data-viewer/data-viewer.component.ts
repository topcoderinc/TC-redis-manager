import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AddValueDialogComponent, ValueMode} from '../add-value-dialog/add-value-dialog.component';
import {MatDialog, MatSnackBar} from '@angular/material';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {RedisService} from '../../services/redis.service';
import _ from 'lodash';
import {UtilService} from '../../services/util.service';
import {Observable} from 'rxjs';
import {Store} from '@ngrx/store';
import {REQ_FETCH_TREE} from '../../ngrx/actions/redis-actions';

/**
 * the backend type to frontend type map
 */
const TYPE_MAP = {
  string: 'String',
  list: 'List',
  set: 'Set',
  zset: 'Ordered Set',
  hash: 'Hash Map',
};

/**
 * redis data type viewer component
 */
@Component({
  selector: 'app-data-viewer',
  templateUrl: './data-viewer.component.html',
  styleUrls: ['./data-viewer.component.scss']
})
export class DataViewerComponent implements OnInit, OnChanges {
  @Input() pageData = null;
  @Output() onNewValue = new EventEmitter();
  @Output() onDeleteValue = new EventEmitter();
  loadingPageData = false;

  public page = {
    pageIndex: 0,
    pageSize: 20,
  };
  cli$: Observable<any> = null;
  public data = [];
  public setCachedData = null;
  public hashCachedData = null;
  public selectedMap = {};

  constructor(
    public dialogService: MatDialog,
    private snackBar: MatSnackBar,
    private redisService: RedisService,
    private util: UtilService,
    private _store: Store<any>,
  ) {

    this.cli$ = this._store.select('cli');
  }

  ngOnInit() {

  }


  /**
   * is need show table,string type not need table?
   * @return {boolean}
   */
  isNeedShowTable() {
    return ['list', 'set', 'zset', 'hash'].findIndex(v => v === this.pageData.item.type) >= 0;
  }

  /**
   * remove element
   * @param element the element
   */
  removeElement(element) {
    const t = this.pageData.item.type;
    const pk = this.pageData.item.key;
    let values = [];
    if (element) {
      values = [this.key(element)];
    } else {
      _.each(this.selectedMap, (v, k) => {
        if (v) {
          values.push(k);
        }
      });
    }
    this.dialogService.open(ConfirmDialogComponent, {
      width: '250px', data: {
        title: 'Delete Confirm',
        message: `Are you sure you want delete ${element ? 'this' : 'select'} value${values.length > 1 ? 's' : ''} ?`
      }
    }).afterClosed().subscribe(ret => {
      if (ret) {
        let command = [];
        if (t === 'set') {
          command = ['SREM', pk];
        } else if (t === 'zset') {
          command = ['ZREM', pk];
        } else if (t === 'hash') {
          command = ['HDEL', pk];
        }
        command = command.concat(values);
        this.redisService.call(this.pageData.id, [command]).subscribe(() => {

          _.each(values, v => {
            delete this.selectedMap[v];
          });

          this._store.dispatch({type: REQ_FETCH_TREE, payload: {id: this.pageData.id}});
          this.hashCachedData = null;
          this.setCachedData = null;
          this.fetchData();
          this.util.showMessage('Delete successful');
        }, () => this.util.showMessage('Delete failed'));
      }
    });
  }

  /**
   * get columns by type
   */
  getColumns() {
    const t = this.pageData.item.type;
    if (t === 'list' || t === 'set') {
      let c = ['index', 'value'];
      if (t === 'set') {
        c = ['checkbox'].concat(c);
        c.push('actions');
      }
      return c;
    } else if (t === 'zset') {
      return ['checkbox', 'index', 'value', 'score', 'actions'];
    } else {
      return ['checkbox', 'key', 'value', 'actions'];
    }
  }

  /**
   * get unique key for item
   * @param item
   */
  key(item) {
    const t = this.pageData.item.type;
    if (t === 'hash') {
      return item.key;
    }
    return item.value;
  }


  /**
   * fetch data from redis according to the paging and type
   */
  fetchData() {
    const start = this.page.pageIndex * this.page.pageSize;
    const end = start + this.page.pageSize - 1;
    const type = this.pageData.item.type;
    const key = this.pageData.item.key;
    const instanceId = this.pageData.id;

    const injectValuesToArray = (values) => (_.map(values, (v, index) => ({
      index: this.page.pageIndex * this.page.pageSize + index,
      value: v
    })));


    if (type === 'list') {
      this.loadingPageData = true;
      this.redisService.call(instanceId, [['LRANGE', key, start, end]]).subscribe(ret => {
          this.data = injectValuesToArray(ret[0]);
          this.loadingPageData = false;
        }
      );
    } else if (type === 'zset') {
      this.loadingPageData = true;
      this.redisService.call(instanceId, [['ZRANGE', key, start, end, 'withscores']]).subscribe(ret => {
          this.data = [];
          for (let i = 0; i < ret[0].length;) {
            this.data.push({
              index: this.page.pageIndex * this.page.pageSize + (i / 2),
              score: parseInt(ret[0][i + 1], 10),
              value: ret[0][i],
            });
            i += 2;
            this.loadingPageData = false;
          }
        }
      );
    } else if (type === 'set') {
      if (!this.setCachedData) {
        this.loadingPageData = true;
        this.redisService.call(instanceId, [['SMEMBERS', key]]).subscribe(ret => {
          this.setCachedData = injectValuesToArray(ret[0]);
          this.data = this.setCachedData.slice(start, end);
          this.loadingPageData = false;
        });
      } else {
        this.data = this.setCachedData.slice(start, end);
      }
    } else if (type === 'hash') {
      if (!this.hashCachedData) {
        this.loadingPageData = true;
        this.redisService.call(instanceId, [['HGETALL', key]]).subscribe(ret => {
            this.hashCachedData = [];
            for (let i = 0; i < ret[0].length;) {
              this.hashCachedData.push({
                key: ret[0][i],
                value: ret[0][i + 1],
              });
              i += 2;
            }
            this.data = this.hashCachedData.slice(start, end);
            this.loadingPageData = false;
          }
        );
      } else {
        this.data = this.hashCachedData.slice(start, end);
      }
    }
  }

  /**
   * on add new record
   */
  onAddNewRecords(values) {
    const viewMode = new ValueMode();
    viewMode.type = TYPE_MAP[this.pageData.item.type];
    viewMode.hideType = true;

    if (this.pageData.item.type === 'folder') {
      viewMode.type = 'String';
      viewMode.hideType = false;
    }
    viewMode.id = this.pageData.id;
    viewMode.key = this.pageData.item['key'];
    if (values) {
      viewMode.values = values;
      viewMode.isEditMode = true;
    }
    this.dialogService.open(AddValueDialogComponent, {
      minWidth: Math.min(1000, Math.max(480, (viewMode.key.length / 50) * 480)) + 'px',
      minHeight: '400px',
      data: viewMode,
    }).afterClosed().subscribe(ret => {
      if (ret) {
        ret.onSuccess = () => {
          if (this.pageData.item.type === 'folder') {
          } else {
            this._store.dispatch({type: REQ_FETCH_TREE, payload: {id: this.pageData.id}});
            this.hashCachedData = null;
            this.setCachedData = null;
            this.fetchData();
          }
        };
        this.onNewValue.emit(ret);
      }
    });
  }

  /**
   * on save string event
   */
  onSaveString() {
    if (this.pageData.item.value.trim() === '') {
      this.snackBar.open('Value cannot be empty', 'Ok');
    } else {
      this.redisService.call(this.pageData.id,
        [['set', this.pageData.item.key, this.pageData.item.value.trim()]]).subscribe(() => {
        this.snackBar.open('save successful', 'Ok', {duration: 3000});
      });
    }
  }


  /**
   * get all keys and sub keys from folder item
   * @return {any[]}
   */
  getAllFolderKeys() {
    const result = [];
    const getAllKeys = (arr, children) => {
      children.forEach(i => {
        if (i.type === 'folder') {
          getAllKeys(arr, i.children);
        } else {
          arr.push(i.key);
        }
      });
    };
    getAllKeys(result, this.pageData.item.children);
    return result;
  }


  /**
   * on delete redis value
   */
  onDelete() {
    if (_.some(this.selectedMap, v => v)) {
      this.removeElement(null);
      return;
    }
    this.dialogService.open(ConfirmDialogComponent, {
      width: '320px', data: {
        title: 'Delete Confirm',
        message: `Are you sure you want delete all values that belongs to "${this.pageData.item.key}" ?`,
      }
    }).afterClosed().subscribe(ret => {
      if (ret) {
        let keys = [];
        if (this.pageData.item.type === 'folder') {
          keys = this.getAllFolderKeys();
        } else {
          keys = [this.pageData.item.key];
        }
        this.redisService.call(this.pageData.id, [['DEL'].concat(keys)]).subscribe(() => {
          this.util.showMessage('delete successful');
          this.pageData.item.deleted = true;
          this.onDeleteValue.emit();
          this._store.dispatch({type: REQ_FETCH_TREE, payload: {id: this.pageData.id}});
        }, e => {
          this.util.showMessage('delete failed');
          console.error(e);
        });
      }
    });
  }

  /**
   * on edit map elements
   * @param elements the element arr
   */
  onEditMapElements(elements) {
    this.onAddNewRecords({hashMapValues: JSON.parse(JSON.stringify(elements))});
  }

  /**
   * on edit select values
   */
  onEdit() {
    const keys = [];
    _.each(this.selectedMap, (v, k) => {
      if (v) {
        keys.push(k);
      }
    });

    if (keys.length <= 0) {
      return this.util.showMessage('You need to select a row first');
    }

    if (this.pageData.item.type === 'hash') {
      const items = [];
      _.each(keys, k => {
        items.push(this.hashCachedData.find(i => i.key === k));
      });
      this.onEditMapElements(items);
    }
  }

  /**
   * when page changed
   * @param page the page item
   */
  onPageEvent(page) {
    this.page = page;
    this.fetchData();
  }

  /**
   * when type changed from parent
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.page.pageIndex = 0;
    this.data = [];
    this.selectedMap = {};
    this.setCachedData = null;
    this.hashCachedData = null;
    this.fetchData();
  }
}
