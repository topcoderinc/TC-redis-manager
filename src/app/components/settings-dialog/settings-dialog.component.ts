import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';
import {ThemeConfig} from '../../theme-config';


const THEME_KEY = ThemeConfig.THEME_KEY;

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent implements OnInit {
  public THEMES = ThemeConfig.THEMES;

  public currentTheme = localStorage.getItem(THEME_KEY) || this.THEMES[0];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data) {
  }

  clearTheme() {
    const node = document.getElementById(ThemeConfig.BODY_ID);
    this.THEMES.forEach(t => {
      node.classList.remove(`${t}-theme`);
    });
  }

  onChange(evt) {
    if (this.currentTheme !== evt) {
      const node = document.getElementById(ThemeConfig.BODY_ID);
      this.currentTheme = evt;
      localStorage.setItem(THEME_KEY, evt);
      this.clearTheme();
      node.classList.add(`${evt}-theme`);
    }
  }

  ngOnInit() {
  }

}
