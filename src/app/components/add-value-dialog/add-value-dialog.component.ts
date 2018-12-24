import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatSnackBar} from '@angular/material';
import {UtilService} from '../../services/util.service';


/**
 * the redis value mode
 */
export class ValueMode {
  id: string;
  key: string;
  type: string;
  hideType: boolean;
  isEditMode = false;
  values = {
    values: [{value: ''}],
    orderedValues: [{value: '', score: '0'}],
    hashMapValues: [{key: '', value: ''}],
  };
  len = 0;
  rawLine = [];
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

  constructor(
    public dialogRef: MatDialogRef<AddValueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ValueMode,
    private snackBar: MatSnackBar,
    private util: UtilService
  ) {
  }

  ngOnInit() {
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
      return this.showError('Key cannot be empty');
    }
    this.data.rawLine = [];
    switch (this.data.type) {
      case 'String': {
        const values = this.data.values.values;
        values[0].value = getValue(values[0].value);
        if (!values[0].value) {
          return this.showError(`${this.data.type} value cannot be empty`);
        }
        this.data.rawLine.push('set');
        this.data.rawLine.push(this.data.key);
        this.data.rawLine.push(values[0].value);
        break;
      }
      case 'List':
      case 'Set': {
        const values = this.data.values.values;
        this.data.rawLine.push(this.data.type === 'List' ? 'RPUSH' : 'sadd');
        this.data.rawLine.push(this.data.key);
        for (let i = 0; i < values.length; i++) {
          values[i].value = getValue(values[i].value);
          if (!values[i].value) {
            return this.showError(`${this.data.type} value of row ${i + 1} cannot be empty`);
          }
          this.data.rawLine.push(values[i].value);
        }
        this.data.len = values.length;
        break;
      }
      case 'Ordered Set': {
        const values = this.data.values.orderedValues;
        this.data.rawLine.push('zadd');
        this.data.rawLine.push(this.data.key);
        for (let i = 0; i < values.length; i++) {
          values[i].value = getValue(values[i].value);
          if (!values[i].value) {
            return this.showError(`${this.data.type} value of row ${i + 1} cannot be empty`);
          }

          values[i].score = getValue(values[i].score);
          if (!values[i].score) {
            return this.showError(`${this.data.type} Score of row ${i + 1} cannot be empty`);
          }
          const score = parseInt(values[i].score, 10);
          if (score === 0) {
            return this.showError(`${this.data.type} Score of row ${i + 1} cannot be 0`);
          }
          this.data.rawLine.push(score);
          this.data.rawLine.push(values[i].value);
        }
        this.data.len = values.length;
        break;
      }
      case 'Hash Map': {
        const values = this.data.values.hashMapValues;
        for (let i = 0; i < values.length; i++) {
          this.data.rawLine.push('HMSET');
          this.data.rawLine.push(this.data.key);
          values[i].value = getValue(values[i].value);
          values[i].key = getValue(values[i].key);
          if (!values[i].key) {
            return this.showError(`${this.data.type} key of row ${i + 1} cannot be empty`);
          }
          if (!values[i].value) {
            return this.showError(`${this.data.type} value of row ${i + 1} cannot be empty`);
          }
          this.data.rawLine.push(values[i].key);
          this.data.rawLine.push(values[i].value);
        }
        this.data.len = values.length;
        break;
      }
    }
    this.dialogRef.close(this.data);
  }
}
