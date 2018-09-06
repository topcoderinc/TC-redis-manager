import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AddValueDialogComponent, ValueMode} from '../add-value-dialog/add-value-dialog.component';
import {MatDialog, MatSnackBar} from '@angular/material';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {RedisService} from '../../services/redis.service';
import _ from 'lodash';
import {UtilService} from '../../services/util.service';

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

  public page = {
    pageIndex: 0,
    pageSize: 20,
  };
  public data = [];
  public setCachedData = null;
  public hashCachedData = null;

  constructor(
    public dialogService: MatDialog,
    private snackBar: MatSnackBar,
    private redisService: RedisService,
    private util: UtilService,
  ) {
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
   * get columns by type
   */
  getColumns() {
    const t = this.pageData.item.type;
    if (t === 'list' || t === 'set') {
      return ['index', 'value'];
    } else if (t === 'zset') {
      return ['index', 'value', 'score'];
    } else {
      return ['key', 'value'];
    }
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
      this.redisService.call(instanceId, [['LRANGE', key, start, end]]).subscribe(ret => {
          this.data = injectValuesToArray(ret[0]);
        }
      );
    } else if (type === 'zset') {
      this.redisService.call(instanceId, [['ZRANGE', key, start, end, 'withscores']]).subscribe(ret => {
          this.data = [];
          for (let i = 0; i < ret[0].length;) {
            this.data.push({
              index: this.page.pageIndex * this.page.pageSize + (i / 2),
              score: parseInt(ret[0][i + 1], 10),
              value: ret[0][i],
            });
            i += 2;
          }
        }
      );
    } else if (type === 'set') {
      if (!this.setCachedData) {
        this.redisService.call(instanceId, [['SMEMBERS', key]]).subscribe(ret => {
          this.setCachedData = injectValuesToArray(ret[0]);
          this.data = this.setCachedData.slice(start, end);
        });
      } else {
        this.data = this.setCachedData.slice(start, end);
      }
    } else if (type === 'hash') {
      if (!this.hashCachedData) {
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
  onAddNewRecords() {
    const viewMode = new ValueMode();
    viewMode.type = TYPE_MAP[this.pageData.item.type];
    viewMode.hideType = true;

    if (this.pageData.item.type === 'folder') {
      viewMode.type = 'String';
      viewMode.hideType = false;
    }
    viewMode.id = this.pageData.id;
    viewMode.key = this.pageData.item['key'];
    this.dialogService.open(AddValueDialogComponent, {
      width: '480px',
      data: viewMode,
    }).afterClosed().subscribe(ret => {
      if (ret) {
        ret.onSuccess = () => {
          if (this.pageData.item.type === 'folder') {
          } else {
            if (this.pageData.item.type !== 'string') {
              this.pageData.item.len += ret.len;
            }
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
    this.dialogService.open(ConfirmDialogComponent, {
      width: '250px', data: {
        title: 'Delete Confirm',
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
        }, e => {
          this.util.showMessage('delete failed');
          console.error(e);
        });
      }
    });
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
    this.setCachedData = null;
    this.hashCachedData = null;
    this.fetchData();
  }
}
