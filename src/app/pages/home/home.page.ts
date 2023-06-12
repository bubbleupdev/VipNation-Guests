import { Component, OnInit } from '@angular/core';
import {DataService} from "../../services/data.service";
import {ITourDate} from "../../interfaces/tourDate";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  public tourDate: ITourDate;

  constructor(
    private dataService: DataService,
    private router: Router
  ) { }

  ngOnInit() {
    this.dataService.selectedTourDate$.subscribe((tourDate) => {
      this.tourDate = tourDate;
    });
  }

  get tourDateTitle() {
    if (this.tourDate) {
      return this.tourDate.name;
    }
    else {
      return '';
    }
  }

}
