import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../../services/data.service";
import {ITourDate} from "../../interfaces/tourDate";
import {Router} from "@angular/router";
import {LookupFormComponent} from "../../shared/forms/lookup-form/lookup-form.component";
import {Subscription} from "rxjs";
import {CheckQueService} from "../../services/check-que.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  @ViewChild('lookupForm') lookupForm:LookupFormComponent;

  public tourDate: ITourDate;
  public inScan: boolean = false;

  private sub: Subscription;

  constructor(
    private dataService: DataService,
    private checkService: CheckQueService,
    private router: Router
  ) { }

  ngOnInit() {
   this.sub = this.dataService.selectedTourDate$.subscribe((tourDate) => {
      console.log('update current tourdate');
      console.log(tourDate);

      this.tourDate = this.checkService.updateTourDateWithStoredChecks(tourDate);
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
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
