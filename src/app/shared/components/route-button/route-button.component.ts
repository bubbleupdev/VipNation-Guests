import {Component, HostListener, Input, OnInit} from '@angular/core';
import {NavigationBehaviorOptions, Router} from '@angular/router';
import {Platform} from "@ionic/angular";


@Component({
    selector: 'route-button',
    templateUrl: './route-button.component.html',
    styleUrls: ['./route-button.component.scss'],
})
export class RouteButtonComponent implements OnInit {

    @Input() href: string = '';
    @Input() cssClass: string | undefined;
    @Input() label = '';
    @Input() ariaLabel = '';
    @Input() extras: NavigationBehaviorOptions | null = null;

    protected loadingElement: any;
    protected loadingBackdropElement: any;
    protected loadingWrapperElement: any;

    // @HostListener('click', ['$event.target'])
    // onClick(target) {
    //     this.routeToHref();
    // }


    constructor(private router: Router,
                private platform: Platform) {
    }

    ngOnInit() {
    }


    routeToHref(ev: Event) {

        if (this.href && (this.href.startsWith('tel:') || this.href.startsWith('mailto:'))) {
          return false;
        }
        else {
          ev.preventDefault();
          let currentUrl = null;

          if (this.isValidUrl(this.href)) {
            currentUrl = new URL(this.href);
          }

          if (currentUrl && currentUrl.hostname !== window.location.hostname) {
            console.log('opening with IAB' + currentUrl);
            if ( (this.platform.is('iphone') || this.platform.is('ipad') ) && !this.platform.is('mobileweb') ) {
              (window as any).cordova.InAppBrowser.open(this.href, '_system', 'hidden=yes,location=yes');
            } else {
              const newWindow = window.open(this.href, '_blank');
              if (newWindow) {
                newWindow.focus();
              }
            }
          } else {

            let href = this.href;

            if (this.extras) {
              this.router.navigateByUrl(href, this.extras).finally(() => {
              });
            }
            else {
              this.router.navigateByUrl(href).finally(() => {
              });
            }
          }
          return false;
        }
    }

    protected isValidUrl(url: string) {
        try {
            const urlObject = new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    initLoader() {
        this.loadingElement = document.querySelector('ion-loading#preloader-general');
        this.loadingBackdropElement = document.querySelector('ion-loading#preloader-general > ion-backdrop');
        this.loadingWrapperElement = document.querySelector('ion-loading#preloader-general > div.loading-wrapper');
    }

    public displayLoader() {
        this.loadingElement.classList.remove('overlay-hidden');
        this.loadingBackdropElement.style.opacity = 0.32;
        this.loadingWrapperElement.style.opacity = 1;
    }

    public dismissLoader() {
        if (!this.loadingElement.classList.contains('overlay-hidden')) {
            this.loadingElement.classList.add('overlay-hidden');
        }
        this.loadingBackdropElement.style.opacity = 0;
        this.loadingWrapperElement.style.opacity = 0;
    }
}
