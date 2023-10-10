import { Injectable } from "@angular/core";
import { from, Observable, of, throwError } from "rxjs";
import { GraphqlService } from "./graphql.service";
import {catchError, delayWhen, map, tap} from "rxjs/operators";
import { DataHelper } from "../helpers/data.helper";
import {ILoginResult, IUserAuth} from "../interfaces/user-auth.interface";
import {GetUserTokenMutation} from "../../graphql/mutations";
import {LogService} from "./log.service";


@Injectable({
  providedIn: "root"
})
export class ConnectService {
  constructor(
    private graphqlService: GraphqlService,
  ) {}

  state: any;

  public currentUserEmail;

  public async isUserAuthenticated(): Promise<any> {

    const state = this.state;

    try {
      const data =
        state &&
        state.content &&
        state.content.userAuth &&
        state.content.userAuth.data;

      this.graphqlService.userAuthToken = state.entities.userAuth[data["data"]]
        .accessToken as any;
      this.graphqlService.userAuthTokenExpirationDate = DataHelper.getDateFromString(
        state.entities.userAuth[data["data"]].expiresAt
      );
      this.graphqlService.userRefreshToken = state.entities.userAuth[
        data["data"]
      ].refreshToken as any;

      // if (
      //   !this.graphqlService.userAuthToken ||
      //   // @ts-ignore
      //   new Date() > this.graphqlService.userAuthTokenExpirationDate ||
      //   !this.graphqlService.userRefreshToken
      // ) {
      //   await this.graphqlService.getUserTokenByRefreshToken().toPromise();
      // }

      // @ts-ignore
      if (
        !this.graphqlService.userAuthToken ||
        // @ts-ignore
        new Date() > this.graphqlService.userAuthTokenExpirationDate
      ) {
        this.logout();
        // @ts-ignore
        throw "not authenticated";
      }

      return of(data);
    } catch (e) {
      // @ts-ignore
      throw "not authenticated";
    }
  }

  public getUserTokenByCredentials(login, password): Observable<IUserAuth> {

    LogService.log('getUserTokenByCredentials', {login, password: 'hidden'});

    return from(
      this.graphqlService.runMutation(GetUserTokenMutation, {
        user: {
          login: login,
          password: password
        }
      })
    ).pipe(
      map(result => ({
        data: result.data
      })),
      tap((loginResult: any) => {

        if (loginResult === null || loginResult === undefined || loginResult.data.getUserToken === null) {
          throw ('Error happened');
        }
        const data = loginResult.data.getUserToken;

        if (data.result == 'ok') {

          LogService.log('login success', data);

          const userAuth = data.token;
          if (userAuth === null || userAuth === undefined) {
            throw ('Authorize error');
          }
          this.currentUserEmail = userAuth.name;

          this.graphqlService.userAuthToken =
            userAuth.accessToken;
          this.graphqlService.userAuthTokenExpirationDate = DataHelper.getDateFromString(
            userAuth.expiresAt
          );
          this.graphqlService.userRefreshToken =
            userAuth.refreshToken;
          return userAuth;
        }
        else {
          throw (data.error);
        }

      }),
      catchError(err => {
        LogService.log('login error', err);
        return throwError(err);
      })
    );
  }



  public logout(): Observable<any> {
    this.currentUserEmail = null;

    this.graphqlService.userAuthToken = null;
    this.graphqlService.userAuthTokenExpirationDate = null;
    this.graphqlService.userRefreshToken = null;

    return of(true);
  }
}
