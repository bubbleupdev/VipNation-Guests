import {Injectable, Injector} from '@angular/core';
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class LogoutAuthService {

  private authService;

  constructor(
    injector:Injector
  ) {
    setTimeout(() => this.authService = injector.get(AuthService));
  }


  public logout() {
    this.authService.logoutWithRedirect();
  }

}
