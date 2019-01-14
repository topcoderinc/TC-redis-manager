import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-information-dialog',
  templateUrl: './information-dialog.component.html',
  styleUrls: ['./information-dialog.component.scss']
})
export class InformationDialogComponent implements OnInit {
  isLoading = true;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data) {
  }


  ngOnInit() {
    setTimeout(() => {
      this.isLoading = false;
    }, 300);
  }

}
