import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {LookupFormComponent} from "../../shared/forms/lookup-form/lookup-form.component";
import {ITourDate} from "../../interfaces/tourDate";
import {Subscription} from "rxjs";
import {DataService} from "../../services/data.service";
import {CheckQueService} from "../../services/check-que.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-send-sms',
  templateUrl: './send-sms.page.html',
  styleUrls: ['./send-sms.page.scss'],
})
export class SendSmsPage implements OnInit, OnDestroy {
//  @ViewChild('lookupForm') lookupForm:LookupFormComponent;

  public tourDate: ITourDate;

  private sub: Subscription;

  constructor(
    private dataService: DataService,
    private checkService: CheckQueService,
    private router: Router
  ) { }

  ngOnInit() {
    this.sub = this.dataService.selectedTourDate$.subscribe((tourDate) => {
      console.log('update current tourdate');
      // console.log(tourDate);

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

}
