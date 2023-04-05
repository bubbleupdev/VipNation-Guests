import { Component, OnInit } from '@angular/core';
import {Subscription} from "rxjs";
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";
import {PlatformService} from "../../services/platform.service";

@Component({
  selector: 'app-logout',
  templateUrl: './logout.page.html',
  styleUrls: ['./logout.page.scss'],
})
export class LogoutPage implements OnInit {

  private sub: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private platformService: PlatformService,
  ) { }

  ngOnInit() {
    this.sub = this.authService.logout().subscribe((url) => {
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
