import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {CheckQueService} from "../../services/check-que.service";
import {count} from "rxjs";
import {SearchService} from "../../services/search.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  @ViewChild('searchToggle') searchToggle: ElementRef;
  @ViewChild('schemeToggle') schemeToggle: ElementRef;

  isDarkThemeActive: Boolean = true

  public checkCount = 0;
  public waitCount = 0;

  public strongSearch = false;

  constructor(
    private checkService: CheckQueService,
    private searchService: SearchService
  ) { }

  ngOnInit() {
    this.strongSearch = this.searchService.strongSearch;

    if (document.body.classList.contains('dark')) {
      this.isDarkThemeActive = true;
    }
    else {
      this.isDarkThemeActive = false;
    }

    this.checkService.checks$.subscribe((checks) => {
        this.checkCount = (checks) ? checks.length : 0;
    });
  }

  handleToggleDarkTheme(e) {
    document.body.classList.toggle('dark', e.detail.checked);
  }

  handleToggleSearch(e) {
    this.searchService.strongSearch = e.detail.checked;
  }

}
