import { Component, OnInit } from '@angular/core';
import {DataService} from "../../services/data.service";
import {ITourDates} from "../../interfaces/tourDate";
import {NavigationEnd, Router} from "@angular/router";
import {filter, finalize, switchMap, takeWhile} from "rxjs/operators";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-select-event',
  templateUrl: './select-event.page.html',
  styleUrls: ['./select-event.page.scss'],
})
export class SelectEventPage implements OnInit {

  public tourDates: ITourDates;
  protected sub: Subscription;

  constructor(
    private dataService: DataService,
    private router: Router
  ) { }

  ngOnInit() {

    this.sub = this.dataService.tourDates$.subscribe((tourDates) => {
       this.tourDates = tourDates;
    });



  }

}
