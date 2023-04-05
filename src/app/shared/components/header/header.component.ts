import {
  Component,
  OnDestroy,
} from "@angular/core";
import {ActivatedRoute, NavigationEnd, Router, RouterState} from "@angular/router";
import {combineLatest, Observable} from "rxjs";
import {filter, map} from "rxjs/operators";


@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.sass"]
})
export class HeaderComponent implements OnDestroy {

  public selfShow: boolean = false ;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initRoute();
  }

  ngOnInit() {

  }

  initRoute() {
    let prevUrl: string | null = null;
    combineLatest(
      this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event: NavigationEnd) => event.urlAfterRedirects.split("#")[0]),
        filter((currentUrl: string) => {
          if (currentUrl !== prevUrl) {
            prevUrl = currentUrl;
            return true;
          }
          return false;
        })
      )
    )
    //      .pipe(throttleTime(500, undefined, { leading: true, trailing: true }))
      .subscribe(([currentUrl]) => {
        // this.pageMetaService.injectPageMeta(currentUrl, entities);
        this.selfShow = !currentUrl.startsWith("/training");
      });
  }

  ngOnDestroy() {
  }


}
