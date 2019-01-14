import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {UtilService} from '../../services/util.service';
import {RedisService} from '../../services/redis.service';
import { saveAs } from 'file-saver';
import _ from 'lodash';
import {Store} from '@ngrx/store';
import {ReqFetchTree} from '../../ngrx/actions/redis-actions';

@Component({
  selector: 'app-import-data-dialog',
  templateUrl: './import-data-dialog.component.html',
  styleUrls: ['./import-data-dialog.component.scss']
})
export class ImportDataDialogComponent implements OnInit {

  public instanceId = '';

  public rawContent = '';
  public flushDB = true;
  public opType = '';
  public exportType = 'redis';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private dialogRef: MatDialogRef<ImportDataDialogComponent>,
    private redisService: RedisService,
    private _store: Store<any>,
    public util: UtilService) {
  }


  ngOnInit() {
    this.instanceId = this.data.currentInstance.id;
    this.opType = this.data.opType;
  }

  parseCommand(str) {

    const placeholder = '@@@@@@@@@';
    let index = 0;
    let doubleQuotes = false;
    const args = [];

    str = str.replace(/\\"/g, placeholder);
    const length = str.length;
    const pushArg = (arg) => {
      if (!arg || arg.trim() === '') {
        return;
      }
      args.push(arg.replace(new RegExp(placeholder, 'g'), '"'));
    };
    for (let i = 0; i < length; i++) {
      const char = str[i];
      if (char === '"') {
        if (doubleQuotes) {
          pushArg(str.substr(index, i - index));
          doubleQuotes = false;
          index = i + 1;
        } else {
          doubleQuotes = true;
          index = index === i ? (i + 1) : index;
        }
      }
      if (!doubleQuotes && char === ' ') { // this is a word
        pushArg(str.substr(index, i - index));
        index = i + 1;
      }
    }
    pushArg(str.substr(index));
    return args;
  }


  /**
   * on export click
   */
  onExportClick() {

    this.redisService.export(this.instanceId, this.exportType).subscribe(rsp => {
      const data = new Blob([rsp], { type: 'text/plain;charset=utf-8' });
      saveAs(data, `db-${Date.now()}.${this.exportType}`);
      this.util.showMessage('Exported successfully.');
    }, err => {
      this.util.showMessage('Fail to export redis commands: ' + this.util.getErrorMessage(err));
    });

    this.dialogRef.close();
  }

  /**
   * on import click
   */
  onImportClick() {
    if (this.rawContent.trim() === '') {
      this.util.showMessage('The commands to import cannot be empty.');
      return;
    }
    const commands = [];
    if (this.flushDB) {
      commands.push(['FLUSHDB']);
    }


    const parts = this.rawContent.trim().split('\n');
    parts.forEach(p => {
      if (p.trim() === '') {
        return;
      }
      const args = this.parseCommand(p.trim());
      if (args.length > 0) {
        commands.push(args);
      }
    });

    const totalRow = this.flushDB ? commands.length - 1 : commands.length;
    this.redisService.call(this.instanceId, commands).subscribe((rsp) => {
      let numberOfSucceed = 0;
      _.each(rsp, v => {
        numberOfSucceed += (!!v && v.toString().toLowerCase().indexOf('err') < 0) ? 1 : 0;
      });
      numberOfSucceed -= this.flushDB ? 1 : 0;
      const numberOfFailed = totalRow - numberOfSucceed;
      this.util.showMessage(`${numberOfSucceed} row${numberOfSucceed !== 1 ? 's were' : ' was'} imported
                            successfully, ${numberOfFailed} row${numberOfFailed !== 1 ? 's have' : ' has'} failed.`);
      this.dialogRef.close();
      this._store.dispatch(new ReqFetchTree({id: this.instanceId}));
    }, err => {
      this.util.showMessage('Failed to import commands: ' + this.util.getErrorMessage(err));
    });
  }
}
