import {Component, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../../services/data.service";
import {ITourDate} from "../../interfaces/tourDate";
import {Router} from "@angular/router";
import {LookupFormComponent} from "../../shared/forms/lookup-form/lookup-form.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  @ViewChild('lookupForm') lookupForm:LookupFormComponent;

  public tourDate: ITourDate;
  public inScan: boolean = false;

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

  public scanOpened(event: boolean) {
    console.log(event);
    this.inScan = event;
  }

  async stopScan() {
    await this.lookupForm.stopScan();
  }

}
