import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { AuthService } from "../services/auth.service";

const debug = require("debug")("grangersmith:notAuthenticatedGuard");

@Injectable({
  providedIn: "root"
})
export class NotAuthenticatedGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const a = this.authService.isAuthed;
    if (a) {
      debug(`locked route: ${state.url}, redirect to /workout`);
      this.router.navigate(["/explore"]);
    }
    return !a;

      // tap((isAuthenticated: boolean) => {
      //   console.log(isAuthenticated);
      //   if (isAuthenticated) {
      //     debug(`locked route: ${state.url}, redirect to /workout`);
      //     this.router.navigate(["/workout"]);
      //   }
      // }),
//      map(res => !res) // access only non authenticated
//    ));
  }
}
