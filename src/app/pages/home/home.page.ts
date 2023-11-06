import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../../services/data.service";
import {ITourDate} from "../../interfaces/tourDate";
import {LookupFormComponent} from "../../shared/forms/lookup-form/lookup-form.component";
import {Subscription} from "rxjs";
import {CheckQueService} from "../../services/check-que.service";
import {NavigationEnd, Router} from "@angular/router";
import {filter, finalize, switchMap, takeWhile} from "rxjs/operators";

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

  public scanOpened(event: boolean) {
    this.inScan = event;
  }

  async stopScan() {
    await this.lookupForm.stopScan();
  }

}
