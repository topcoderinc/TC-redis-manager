import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AddServerModel} from '../../models/add-server-model';
import {UtilService} from '../../services/util.service';


/**
 * add new redis server dialog component
 */
@Component({
  selector: 'app-add-server-dialog',
  templateUrl: './add-server-dialog.component.html',
  styleUrls: ['./add-server-dialog.component.scss']
})
export class AddServerDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<AddServerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddServerModel,
    private util: UtilService,
  ) {
  }

  /**
   * on ok or cancel button click
   * @param type the button type
   */
  onClick(type): void {
    if (type === 'cancel') {
      this.dialogRef.close();
    } else {

      this.data.name = this.util.getValue(this.data.name);
      if (!this.data.name) {
        return this.util.showMessage('Name cannot be empty');
      }

      this.data.ip = this.util.getValue(this.data.ip);
      if (!this.data.ip) {
        return this.util.showMessage('Host cannot be empty');
      }

      this.data.port = this.util.getValue(this.data.port);
      const portNumber = parseInt(this.data.port + '', 10);
      const isPortInteger = (+this.data.port === portNumber);
      if (!this.data.port) {
        return this.util.showMessage('Port cannot be empty');
      }
      else if (!isPortInteger || portNumber < 1 || portNumber > 65535) {
        return this.util.showMessage('Port must be in 1 - 65535');
      }
      else {
        this.data.port = portNumber;
      }

      this.data.db = this.util.getValue(this.data.db + '');
      if (!this.data.db) {
        return this.util.showMessage('Database cannot be empty');
      }

      this.data.db = parseInt(this.data.db + '', 10);
      if (this.data.db < 0 || this.data.db > 16) {
        return this.util.showMessage('Database must be in 0 - 16');
      }


      this.dialogRef.close(this.data);
    }
  }

  ngOnInit() {
  }


}
