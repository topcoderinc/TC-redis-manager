import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';


@Component({
  selector: 'app-import-data-dialog',
  templateUrl: './import-data-dialog.component.html',
  styleUrls: ['./import-data-dialog.component.scss']
})
export class ImportDataDialogComponent implements OnInit {

  public instanceId = '';

  public rawContent = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data) {
  }


  ngOnInit() {
    this.instanceId = this.data.currentInstance.id;
  }

}
