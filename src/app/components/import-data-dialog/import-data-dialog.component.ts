import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {UtilService} from '../../services/util.service';
import {RedisService} from '../../services/redis.service';
import { saveAs } from 'file-saver';
import _ from 'lodash';

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
      this.util.showMessage('export successful');
    }, err => {
      this.util.showMessage('export redis failed, ' + this.util.getErrorMessage(err));
    });

    this.dialogRef.close();
  }

  /**
   * on import click
   */
  onImportClick() {
    if (this.rawContent.trim() === '') {
      this.util.showMessage('data cannot empty');
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
        numberOfSucceed += !!v ? 1 : 0;
      });
      numberOfSucceed -= this.flushDB ? 1 : 0;
      this.util.showMessage(`${numberOfSucceed} of row import successful, ${totalRow
      - numberOfSucceed} of row import failed.`);
      this.dialogRef.close();
    }, err => {
      this.util.showMessage('Import data failed, ' + this.util.getErrorMessage(err));
    });
  }
}
