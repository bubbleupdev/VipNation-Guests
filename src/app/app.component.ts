import { Component } from '@angular/core';
import {AuthService} from "./services/auth.service";
import {DataService} from "./services/data.service";
import {PlatformService} from "./services/platform.service";
import {Subscription} from "rxjs";
import {Router} from "@angular/router";
import {CheckQueService} from "./services/check-que.service";
import {ITourDates} from "./interfaces/tourDate";
import {SplashScreen} from "@capacitor/splash-screen";
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  public appPages = [
    { title: 'Home', url: '/home', icon: 'mail' },
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];

  private sub: Subscription;
  private dataSub: Subscription;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private checkService: CheckQueService,
    private platformService: PlatformService,
    private router: Router
  ) {

  }


  async ngOnInit() {

    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });

    this.initUser();
    this.sub = this.authService.isAuthenticated().subscribe((is: boolean) => {
      if (is) {
        this.initializeSavedData().then(() => {
          this.dataService.selectedTourDate$.subscribe((tourDate) => {
            if (tourDate === null) {
              this.router.navigate(['select-event'], {replaceUrl: true});
            }
            else {
              this.router.navigate(['home'], {replaceUrl: true});
            }
          });

          this.dataService.loadContent().subscribe( () => {
              console.log('All events loaded')
            },
            (err) => {
              console.log('error fetch');
              return;
            },
            ()=>{
              console.log('run periodical checks');
              this.checkService.runPeriodicalChecks();
            });
        });


        // if (this.platformService.isIosApp) {
        //   this.authService.subscribeToAppResume();
        // }
      }
      else {
        // if (this.platformService.isIosApp) {
        //   this.authService.unsubscribeFromAppEvents();
        // }
        console.log('stop periodical checks');
        this.checkService.stopPeriodicalChecks();
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
  }

  // protected publishData(data) {
  //   const pages = data.pages;
  //   const config = data.config;
  //   const galleries = data.galleries;
  //
  //   this.dataService.pagesSubject$.next(pages);
  //   this.dataService.configSubject$.next(config);
  //   this.dataService.galleriesSubject$.next(galleries);
  // }


  async initializeSavedData() {
    const tourDates: ITourDates = await this.dataService.getTourDatesFromStorage();
    const selectedTourDateInstanceId = await this.dataService.getSelectedTdFromStorage();

    let foundTourDate = null;
    if (tourDates && selectedTourDateInstanceId) {
      foundTourDate = tourDates.find((td) => td.instanceId === selectedTourDateInstanceId);
    }
    this.dataService.publishData(tourDates, foundTourDate);

    await this.checkService.loadChecksFromStorage();
  }

  // async loadContent() {
  //   this.dataSub = this.restApiService.getAllContentList().subscribe((all) => {
  //
  //     this.publishData(all);
  //
  //    this.dataService.saveDataToStorage(all);
  //
  //   });
  // }

  protected initUser() {
    this.authService.initUser();

  }
}
