import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../../services/data.service";
import {ITourDate} from "../../interfaces/tourDate";
import {LookupFormComponent} from "../../shared/forms/lookup-form/lookup-form.component";
import {Subscription} from "rxjs";
import {CheckQueService} from "../../services/check-que.service";
import {NavigationEnd, Router} from "@angular/router";
import {filter, finalize, switchMap, takeWhile} from "rxjs/operators";
import {listColors} from "../../helpers/data.helper";

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
  private sub1: Subscription;

  constructor(
    private dataService: DataService,
    private checkService: CheckQueService,
    private router: Router
  ) { }

  protected alive: boolean = false;

  ngOnInit() {
    this.alive = true;

   this.sub = this.dataService.selectedTourDate$.subscribe((tourDate) => {
      console.log('update current tourdate');
      console.log(tourDate);

      this.tourDate = this.checkService.updateTourDateWithStoredChecks(tourDate);
      this.dataService.fillEmptyGuestsForPurchasers(this.tourDate);
    });

    this.sub1 = this.router.events.pipe(
      filter(event => (event instanceof NavigationEnd) && (event.url == '/home')),
      switchMap((v) => {
        return this.dataService.selectedTourDate$.pipe(
          takeWhile(v => this.alive)
        )
        finalize(() => console.log('stopped home checking selected event'))
      }),
      finalize(() => console.log('stopped workouts checking premium'))
    ).subscribe((event) => {
        const url = this.router.url;
        if (!event && url === '/home') {
          this.router.navigate(['/select-event'], {replaceUrl: true});
      }
    });

  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  backToSearch() {
    this.dataService.removeSelectedTdFromStorage().then(()=>{
      console.log('back to search event');
      this.router.navigateByUrl('/select-event', {replaceUrl: true});
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

  get listInfo() {
    if (this.dataService.selectedList) {
      return this.dataService.selectedList.title;
    }
    else {
      return '';
    }
  }


  get listSummary() {
    if (this.dataService.selectedList) {
      const selectedList = this.dataService.selectedList;
      const summary = selectedList.max;
      const notChecked = selectedList.max - selectedList.checkedIn;
      return `${summary} total guests ${selectedList.checkedIn} checked-in, ${notChecked} not checked-in`;
    }
    else {
      return '';
    }
  }

  get tourDateListsSummary() {
    if (this.tourDate) {
      return (this.getSummaryByLists(this.tourDate)).join('<br>');
    }
    else {
      return '';
    }
  }

  get tourDateSummary() {
    if (this.tourDate) {
      const summary = this.tourDate.summary;
      const notChecked = summary.totalGuests - summary.checkedInCount;
      return `${summary.totalGuests} total guests`; //, ${summary.checkedInCount} checked-in, ${notChecked} not checked-in`;
    }
    else {
      return '';
    }
  }

  public scanOpened(event: boolean) {
    this.inScan = event;
  }

  async stopScan() {
    await this.lookupForm.stopScan();
  }

  public getColor() {
    return this.dataService.getListColor(this.tourDate, this.dataService.selectedList);
  }

}
