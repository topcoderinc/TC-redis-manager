import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {AddValueDialogComponent, ValueMode} from '../add-value-dialog/add-value-dialog.component';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {RedisService} from '../../services/redis.service';
import {UtilService} from '../../services/util.service';
import {RemoveRedisServer} from '../../ngrx/actions/redis-actions';
import {ReqLoadPage} from '../../ngrx/actions/page-actions';


/**
 * when user click redis instance item, it will show this component
 */
@Component({
  selector: 'app-instance-root-panel',
  templateUrl: './instance-root-panel.component.html',
  styleUrls: ['./instance-root-panel.component.scss']
})
export class InstanceRootPanelComponent implements OnInit {
  @Input() pageData = null;
  @Input() instance = null;
  @Output() onDisconnect = new EventEmitter();
  @Output() onNewValue = new EventEmitter();
  displayedColumns: string[] = ['key', 'value'];
  cli$: Observable<any> = null;

  page = {
    pageIndex: 0,
    pageSize: 20,
  };

  constructor(public dialogService: MatDialog, private _store: Store<any>) {
    this.cli$ = this._store.select('cli');
  }

  ngOnInit() {
  }

  /**
   * get data according paging
   * @return {any}
   */
  getData() {
    const start = this.page.pageIndex * this.page.pageSize;
    return this.pageData.item.slice(start, start + this.page.pageSize);
  }

  /**
   * when page changed
   * @param evt the page item
   */
  onPageEvent(evt) {
    this.page = evt;
  }

  /**
   * show disconnect confirm dialog
   */
  disconnect() {
    this.dialogService.open(ConfirmDialogComponent, {
      width: '250px', data: {
        title: 'Disconnect redis',
      }
    }).afterClosed().subscribe(ret => {
      if (ret) {
        this.onDisconnect.emit(this.pageData.id);
      }
    });
  }

  /**
   * on add new record event, show a dialog
   */
  onAddNewRecords() {
    const viewMode = new ValueMode();
    viewMode.type = 'String';
    viewMode.id = this.pageData.id;
    viewMode.from = 'root';
    this.dialogService.open(AddValueDialogComponent, {
      width: '480px',
      data: viewMode,
    }).afterClosed().subscribe(ret => {
      if (ret) {
        ret.from = 'root';
        ret.item = {};
        this.onNewValue.emit(ret);
      }
    });
  }
}


