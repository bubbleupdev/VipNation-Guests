import { Injectable } from '@angular/core';
import {DataHelper} from "../helpers/data.helper";
import {ToastController} from "@ionic/angular";
import {from, Observable, throwError} from "rxjs";
import { catchError, flatMap, map, tap } from "rxjs/operators";
import {IUserAuth} from "../interfaces/user-auth.interface";
import {RefreshUserToken} from "../../graphql/mutations";
import {Apollo} from "apollo-angular";
import {LogoutAuthService} from "./logout-auth.service";

@Injectable({
  providedIn: 'root'
})
export class GraphqlService {

  public userAuthToken = null;
  public userAuthTokenExpirationDate = null;
  public userRefreshToken = null;


  constructor(
    private apollo: Apollo,
    private logoutAuthService: LogoutAuthService,
    private toastController: ToastController
  ) { }

  public async runQuery(query, variables?, networkOnly = false) {
    const queryOptions: any = {
      query: query,
      // errorPolicy: 'ignore',
//      fetchPolicy: (networkOnly) ? "network-only" : "no-cache"
      fetchPolicy: "no-cache"
    };

    if (variables !== null && variables !== undefined) {
      queryOptions.variables = variables;
    }

    try {
      await this.checkAuthTokenToBeRefreshedAndRefresh(query);
    }
    catch (e) {
      throw e;
    }

    return await this.apollo
      .query(queryOptions)
      .pipe(
        catchError(err => {
          if (DataHelper.isNotEmpty(err.networkError)) {
            this.toastController
              .create({
                message: "Network Error",
                duration: 4000
              })
              .then(toast => {
                toast.present();
              });
          }

          return throwError(err);
        })
      )
      .toPromise();
  }

  public async runMutation(mutation, variables?) {
    const mutationOptions: any = {
      mutation: mutation,
      // errorPolicy: 'ignore',
    };

    if (variables !== null && variables !== undefined) {
      mutationOptions.variables = variables;
    }

    await this.checkAuthTokenToBeRefreshedAndRefresh(mutation);

    return await this.apollo.mutate(mutationOptions).pipe(
      catchError(err => {

        if (DataHelper.isNotEmpty(err.networkError)) {

          this.toastController.create({
            message: 'Network Error',
            duration: 4000
          }).then(toast => {
            toast.present();
          });
        }

        return throwError(err);
      })
    ).toPromise();
  }

  protected async checkAuthTokenToBeRefreshedAndRefresh(query) {

    const refreshTokenQueries = [
      'refreshUserToken',
      'getUserToken',
      'getUserTokenByToken'
    ];

    if (this.userAuthToken !== null &&
      (new Date() > this.userAuthTokenExpirationDate) &&
      this.userRefreshToken !== null &&
      !refreshTokenQueries.includes(query.definitions[0].name.value)) {
      console.log('refresh token from ' + query.definitions[0].name.value);
      try {
        await this.getUserTokenByRefreshToken().toPromise();
      }
      catch (e) {
        throw e;
      }
    }
  }

  public getUserTokenByRefreshToken(): Observable<IUserAuth> {

    return from(
      this.runMutation(RefreshUserToken, {
        refreshToken: this.userRefreshToken
      })
    ).pipe(
      map(result => ({
        data: result.data
      })),
      tap((userAuth: any) => {

        if (userAuth === null || userAuth === undefined || userAuth.data.refreshUserToken === null || userAuth.data.refreshUserToken === undefined) {
          throw ('err');
        }

        this.userAuthToken = userAuth.data.refreshUserToken.accessToken;
        this.userAuthTokenExpirationDate = DataHelper.getDateFromString(
          userAuth.data.refreshUserToken.expiresAt
        );
        this.userRefreshToken = userAuth.data.refreshUserToken.refreshToken;

        localStorage.setItem('auth', JSON.stringify(userAuth.data.refreshUserToken));
      }),
      catchError(err => {

        this.toastController.create({
          message: 'Session expired',
          duration: 4000
        }).then(toast => {
          toast.present();
        });

        this.logoutAuthService.logout();
        return throwError(err);
      })
    );
  }
}
