import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  @ViewChild('schemeToggle') schemeToggle: ElementRef;

  isDarkThemeActive: Boolean = true

  constructor() { }

  ngOnInit() {
    if (document.body.classList.contains('dark')) {
      this.isDarkThemeActive = true;
    }
    else {
      this.isDarkThemeActive = false;
    }
  }

  handleToggleDarkTheme(e) {
    document.body.classList.toggle('dark', e.detail.checked);
  }

}
