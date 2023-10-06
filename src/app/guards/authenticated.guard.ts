import {Injectable} from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import {Observable} from "rxjs";
import {AuthService} from "../services/auth.service";
import {map, tap} from "rxjs/operators";
import {IUserItem} from "../interfaces/user";

const debug = require("debug")("grangersmith:authenticatedGuard");

@Injectable({
  providedIn: "root"
})
export class AuthenticatedGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const a = this.authService.isAuthed;
    if (!a) {
      debug(`locked route: ${state.url}, redirect to /login`);
      this.router.navigate(["/login"]);
    }
    return a;

    // return this.authService.isAuthenticated().pipe(
    //   tap((isAuthenticated: boolean) => {
    //     if (!isAuthenticated) {
    //       LogService.log(`locked 1 route: ${state.url}, redirect to /login`)
    //       this.router.navigate(["/login"]);
    //     }
    //   }),
    //   map(res => !res) // access only for authenticated
    // );
  }
}
