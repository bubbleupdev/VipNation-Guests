import {AfterViewChecked, AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NavigationEnd, Router} from "@angular/router";
import {ITourDate, ITourDates} from "../../../interfaces/tourDate";
import {SearchService} from "../../../services/search.service";
import {DataService} from "../../../services/data.service";
import {LogService} from "../../../services/log.service";
import {IEventSummary} from "../../../interfaces/event-summary";
import {filter, finalize, switchMap, takeWhile} from "rxjs/operators";
import {Subscription} from "rxjs";
import {IUserItem} from "../../../interfaces/user";
import {UserService} from "../../../services/user.service";

@Component({
  selector: 'app-select-event-form',
  templateUrl: './select-event-form.component.html',
  styleUrls: ['./select-event-form.component.scss'],
})
export class SelectEventFormComponent  implements OnInit {

  @Input() events: ITourDates = [];

  public qrCodeShowing: boolean = false;

  public results = [];
  public selectedEvent: ITourDate = null;
  public group: FormGroup | undefined;

  public inProgress: boolean = false;
  public user: IUserItem = null;

  private sub1: Subscription;

  protected alive: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    public router: Router,
    public dataService: DataService,
    public searchService: SearchService
  ) { }

  ngOnInit() {
    this.alive = true;

    this.group = this.formBuilder.group({
      event: ['', [Validators.required]],
    });


    this.results = this.searchService.getFutureEvents(this.events, 10);


    this.sub1 = this.router.events.pipe(
      filter(event => (event instanceof NavigationEnd) && (event.url == '/select-event')),
      switchMap((v) => {
        return this.dataService.selectedTourDate$.pipe(
          takeWhile(v => this.alive)
        )
        finalize(() => console.log('stopped home checking selected event'))
      }),
      finalize(() => console.log('stopped workouts checking premium'))
    ).subscribe((event) => {
      const url = this.router.url;
      if (event && url === '/select-event') {
        this.selectedEvent = event;
      }
    });
  }


  handleInput(event) {
    this.selectedEvent = null;
    const query = event.target.value.toLowerCase();
    if (query) {

      const filtered = this.searchService.searchInEvents(query, this.events);

      this.results =  filtered.slice(0,9); //this.events.filter((d) => d.name.toLowerCase().indexOf(query) > -1);
    }
    else {
      this.results = this.searchService.getFutureEvents(this.events, 10);;
    }
  }

  public choose(event) {
    this.selectedEvent = event;
    LogService.log('Choose event', this.selectedEvent);
  }

  public goCheckIn() {
    LogService.log('Selected event', this.selectedEvent);
    this.dataService.selectEvent(this.selectedEvent);
//    this.router.navigate(['home'], {replaceUrl: true});
  }

  public reset(event) {
    this.results = this.searchService.getFutureEvents(this.events, 10);
    this.selectedEvent = null;
    this.dataService.removeSelectedTdFromStorage().then(()=>{
      this.dataService.selectedList = null;
    });
  }

  public async processSubmit() {
    return;
  }

  protected getSummaryByLists(event: ITourDate) {
    const lines = [];
    if (event && event.summary.lists) {
       const lists = event.summary.lists;
       lists.forEach(list => {
         const notChecked = list.max - list.checkedIn;
         const line = `${list.checkedIn} ${list.title} checked-in; ${notChecked} ${list.title} not checked-in`;
         lines.push(line);
       });
    }

    return lines;
  }

  get tourDateListsSummary() {
    if (this.selectedEvent) {
      return (this.getSummaryByLists(this.selectedEvent)).join('<br><br>');
    }
    else {
      return '';
    }
  }

  get tourDateSummary() {
    if (this.selectedEvent) {
      const summary = this.selectedEvent.summary;
      const notChecked = summary.totalGuests - summary.checkedInCount;
      return `${summary.totalGuests} total guests | ${summary.checkedInCount} checked-in | ${notChecked} not checked-in`;
    }
    else {
      return '';
    }
  }

  showQr(show: boolean) {
    this.qrCodeShowing = show;
  }

}
