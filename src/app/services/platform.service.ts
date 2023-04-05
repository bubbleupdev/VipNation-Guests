import { Injectable } from '@angular/core';
import {Platform} from "@ionic/angular";

@Injectable({
  providedIn: 'root'
})
export class PlatformService {

  public isMobileApp = false;
  public isIosApp = false;
  public isAndroidApp = false;

  constructor(private platform: Platform) {
    this.init();

  }

  protected init() {
    this.isIosApp =  ((this.platform.is('iphone') || this.platform.is('ipad') ) && !this.platform.is('mobileweb'));
    this.isAndroidApp =  ((this.platform.is('android') /*|| this.platform.is('ipad')*/ ) && !this.platform.is('mobileweb'));
    this.isMobileApp = this.isIosApp || this.isAndroidApp;
  }

}
