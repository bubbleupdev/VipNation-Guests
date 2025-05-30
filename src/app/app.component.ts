import { Component } from '@angular/core';
import {AuthService} from "./services/auth.service";
import {DataService} from "./services/data.service";
import {PlatformService} from "./services/platform.service";
import {Subscription} from "rxjs";
import {Router} from "@angular/router";
import {CheckQueService} from "./services/check-que.service";
import {ITourDates} from "./interfaces/tourDate";
import {SplashScreen} from "@capacitor/splash-screen";
import {LoadingController} from "@ionic/angular";
import {UserService} from "./services/user.service";
import {LogService} from "./services/log.service";
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
    private userService: UserService,
    private platformService: PlatformService,
    private router: Router,
    private logService: LogService,

  ) {

  }


  async ngOnInit() {

    await LogService.log('Starting app');

    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });



    this.initUser();
    this.sub = this.authService.isAuthenticated().subscribe((is: boolean) => {
      if (is) {
        this.initializeSavedData().then(() => {
          this.dataService.selectedTourDate$.subscribe((tourDate) => {

            const url = this.router.url;

            if (tourDate === null) {
              this.router.navigate(['/select-event'], {replaceUrl: true});
            }
            else {
              if (url === '/select-event' || url === '/login') {
                // this.router.navigate(['/home'], {replaceUrl: true});
              }
              if (url === '/login') {
                this.router.navigate(['/select-event'], {replaceUrl: true});
              }

            }
          });

          // loading.present();
          // this.dataService.loadContent().subscribe( () => {
          //     console.log('All events loaded')
          //   },
          //   (err) => {
          //     console.log('error fetch');
          //     return;
          //   },
          //   ()=>{
          //     console.log('run periodical checks');
          //     this.checkService.runPeriodicalChecks();
          //     loading.dismiss();
          //   });
        });

        this.dataService.getAppUserFromStorage().then((userData) => {
          if (userData) {
            this.userService.parseUser(userData);
          }
        });


        console.log('run periodical checks');
        this.checkService.runPeriodicalChecks();
      }
      else {
        // if (this.platformService.isIosApp) {
        //   this.authService.unsubscribeFromAppEvents();
        // }
        this.dataService.removeAppUserFromStorage();
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


  protected initUser() {
    this.authService.initUser();

  }
}
