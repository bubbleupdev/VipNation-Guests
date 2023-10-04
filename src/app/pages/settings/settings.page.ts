import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {CheckQueService} from "../../services/check-que.service";
import {count} from "rxjs";
import {SearchService} from "../../services/search.service";
import {DataService} from "../../services/data.service";

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
    private dataService: DataService,
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

        const notProcessed = checks.filter((check) =>check.processed === false);
        this.waitCount = notProcessed.length;

    });
  }

  handleToggleDarkTheme(e) {
    document.body.classList.toggle('dark', e.detail.checked);
  }

  handleToggleSearch(e) {
    this.searchService.strongSearch = e.detail.checked;
  }

  refresh() {
    console.log('refresh started');
    this.checkService.processQue().then(() => {
      console.log('check done');
      this.dataService.updateCurrentTourDate();
    });
  }

}
