import { Component, OnInit } from '@angular/core';
import {Subscription} from "rxjs";
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";
import {PlatformService} from "../../services/platform.service";
import {DataService} from "../../services/data.service";

@Component({
  selector: 'app-logout',
  templateUrl: './logout.page.html',
  styleUrls: ['./logout.page.scss'],
})
export class LogoutPage implements OnInit {

  private sub: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router,
    private platformService: PlatformService,
  ) { }

  ngOnInit() {
    this.sub = this.authService.logout().subscribe((url) => {
      this.dataService.removeSelectedTdFromStorage().then(()=>{
        console.log('selected cleared');
      });
      if (this.platformService.isMobileApp) {
        window.location.href = url;
      } else {
        this.router.navigateByUrl(url, {replaceUrl: true});
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

}
