import { Component, OnInit } from '@angular/core';
import {DataService} from "../../services/data.service";
import {ITourDates} from "../../interfaces/tourDate";
import {Router} from "@angular/router";

@Component({
  selector: 'app-select-event',
  templateUrl: './select-event.page.html',
  styleUrls: ['./select-event.page.scss'],
})
export class SelectEventPage implements OnInit {

  public tourDates: ITourDates;

  constructor(
    private dataService: DataService,
  ) { }

  ngOnInit() {
    this.dataService.tourDates$.subscribe((tourDates) => {
       this.tourDates = tourDates;
    });
  }

}
