import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar} from '@angular/material';
import {UtilService} from '../../services/util.service';
import _ from 'lodash';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {RedisService} from '../../services/redis.service';


/**
 * the redis value mode
 */
export class ValueMode {
  id: string;
  key: string;
  type: string;
  hideType: boolean;
  isEditMode = false;
  from: string;
  values = {
    values: [{value: ''}],
    orderedValues: [{value: '', score: '0'}],
    hashMapValues: [{key: '', value: ''}],
  };
  len = 0;
  rawLine = [];
  onValueDelete: (element, cb) => {};
}

/**
 * add value dialog component
 */
@Component({
  selector: 'app-add-value-dialog',
  templateUrl: './add-value-dialog.component.html',
  styleUrls: ['./add-value-dialog.component.scss']
})
export class AddValueDialogComponent implements OnInit {

  @ViewChild('valueContainer') private valueContainer: ElementRef;

  title = '';
  constructor(
    public dialogRef: MatDialogRef<AddValueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ValueMode,
    private snackBar: MatSnackBar,
    private util: UtilService,
    private redisService: RedisService,
    private dialogService: MatDialog
  ) {
  }

  ngOnInit() {
    if (this.data.from === 'root') {
      this.title = this.isEditMode() ? 'Edit Records' : 'Add New Record';
    } else {
      this.title = this.isEditMode() ? 'Edit Value' : 'Add New Value';
      if (this.isEditMode()
        && this.data.values && this.data.values.hashMapValues && this.data.values.hashMapValues.length > 1) {
        this.title = 'Edit Values';
      }
    }
  }

  isEditMode() {
    return this.data.isEditMode;
  }
  /**
   * show a error message
   * @param msg the error message text
   */
  showError(msg) {
    this.util.showMessage(msg);
  }

  /**
   * in add button click
   */
  onAdd() {
    const getValue = this.util.getValue;
    this.data.key = getValue(this.data.key);
    if (!this.data.key) {
      return this.showError('The key cannot be empty.');
    }
    this.data.rawLine = [];
    switch (this.data.type) {
      case 'String': {
        const values = this.data.values.values;
        values[0].value = getValue(values[0].value);
        if (!values[0].value) {
          return this.showError(`The value cannot be empty.`);
        }
        this.data.rawLine.push('set');
        this.data.rawLine.push(this.data.key);
        this.data.rawLine.push(values[0].value);
        break;
      }
      case 'List':
      case 'Set': {
        const values = this.data.values.values;
        if (this.hasDuplicates(values, 'value') && this.data.type === 'Set') {
          return this.showError('Duplicated values are found.');
        }
        this.data.rawLine.push(this.data.type === 'List' ? 'RPUSH' : 'sadd');
        this.data.rawLine.push(this.data.key);
        for (let i = 0; i < values.length; i++) {
          values[i].value = getValue(values[i].value);
          if (!values[i].value) {
            return this.showError(`The value in row ${i + 1} cannot be empty.`);
          }
          this.data.rawLine.push(values[i].value);
        }
        this.data.len = values.length;
        break;
      }
      case 'Ordered Set': {
        let values = this.data.values.orderedValues;
        values = _.map(values, v => {
          v.score = _.isNull(v.score) || _.isUndefined(v.score) ? '' : v.score.toString();
          return v;
        });
        if (this.hasDuplicates(values, 'value')) {
          return this.showError('Duplicated values are found.');
        }
        this.data.rawLine.push('zadd');
        this.data.rawLine.push(this.data.key);
        for (let i = 0; i < values.length; i++) {
          values[i].value = getValue(values[i].value);
          if (!values[i].value) {
            return this.showError(`The value in row ${i + 1} cannot be empty.`);
          }

          values[i].score = getValue(values[i].score);
          if (!values[i].score) {
            return this.showError(`The score in row ${i + 1} cannot be empty.`);
          }
          this.data.rawLine.push(parseFloat(values[i].score));
          this.data.rawLine.push(values[i].value);
        }
        this.data.len = values.length;
        break;
      }
      case 'Hash Map': {
        const values = this.data.values.hashMapValues;
        if (this.hasDuplicates(values, 'key')) {
          return this.showError('Duplicated keys are found.');
        }
        for (let i = 0; i < values.length; i++) {
          if (i === 0) {
            this.data.rawLine.push('HMSET');
            this.data.rawLine.push(this.data.key);
          }
          values[i].value = getValue(values[i].value);
          values[i].key = getValue(values[i].key);
          if (!values[i].key) {
            return this.showError(`The key in row ${i + 1} cannot be empty.`);
          }
          if (!values[i].value) {
            return this.showError(`The value in row ${i + 1} cannot be empty.`);
          }
          this.data.rawLine.push(values[i].key);
          this.data.rawLine.push(values[i].value);
        }
        this.data.len = values.length;
        break;
      }
    }
    if (this.data.from === 'root') {
      this.checkIsExist(this.data, () => {
        this.dialogRef.close(this.data);
      });
    } else {
      this.dialogRef.close(this.data);
    }
  }

  /**
   * remove exist key
   * @param ret the ret include id and key
   * @param cb the callback
   */
  removeExistKey(ret, cb) {
    this.redisService.call(ret.id, [['DEL', ret.key]]).subscribe(() => {
      cb();
    }, err => {
      this.util.showMessage('Delete is failed: ' + this.util.getErrorMessage(err));
    });
  }

  /**
   * check is exist
   * @param ret the ret include id and key/values
   * @param cb the callback
   */
  checkIsExist(ret, cb) {
    this.redisService.call(ret.id, [['EXISTS', ret.key]]).subscribe((r) => {
      if (r && r.length > 0 && r[0] > 0) { // exist
        this.dialogService.open(ConfirmDialogComponent, {
          width: '360px', data: {
            title: `Key "${ret.key}" Already Exists`,
            message: `Are you sure you want to replace the original key?`
          }
        }).afterClosed().subscribe(cr => {
          if (cr) {
            this.removeExistKey(ret, cb);
          }
        });
      } else {
        cb();
      }
    }, () => {
      this.util.showMessage('Fail to check the key exists or not.');
    });
  }

  /**
   * Check for duplicates
   */
  hasDuplicates(values, field) {
    const result = _(values).groupBy(field)
      .map((item, itemId) => {
        const obj = {
          v: itemId,
          cnt: _.filter(values, (z) => z[field] === itemId).length
        };
        return obj;
      })
      .filter((c) => c.cnt > 1)
      .value() || [];
    return result.length > 0;
  }

  /**
   * on value delete
   * @param evt
   */
  onValueDelete(evt) {
    if (this.data.onValueDelete) {
      this.data.onValueDelete(evt.element, () => {
        evt.callback();
      });
    }
  }

  onValueAdded() {
    this.scrollToBottom();
  }

  /**
   * Scrolls the element to bottom.
   */
  scrollToBottom(): void {
    setTimeout(() => {
      this.valueContainer.nativeElement.scrollTop = this.valueContainer.nativeElement.scrollHeight;
    }, 10);

  }
}
