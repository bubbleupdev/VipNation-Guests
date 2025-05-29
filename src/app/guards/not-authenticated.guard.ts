import {Injectable} from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import {Observable} from "rxjs";
import {map, tap} from "rxjs/operators";
import {AuthService} from "../services/auth.service";

const debug = require("debug")("grangersmith:notAuthenticatedGuard");

@Injectable({
  providedIn: "root"
})
export class NotAuthenticatedGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const a = this.authService.isAuthed;

    if (a) {
      debug(`locked route: ${state.url}, redirect to /home`);
      this.router.navigate(["/select-event"]);
    }
    return !a;

    // return this.authService.isAuthenticated().pipe(
    //   tap((isAuthenticated: boolean) => {
    //     if (isAuthenticated) {
    //       debug(`locked route: ${state.url}, redirect to /home`);
    //       this.router.navigate(["/home"]);
    //     }
    //   }),
    //   map(res => !res) // access only non authenticated
    // );
  }
}
