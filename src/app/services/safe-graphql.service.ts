import { Injectable } from '@angular/core';
import {Apollo} from "apollo-angular";
import {catchError, timeout} from "rxjs/operators";
import {DataHelper} from "../helpers/data.helper";
import {throwError} from "rxjs";
import {GraphqlService} from "./graphql.service";
import {ToastController} from "@ionic/angular";
import {LogoutAuthService} from "./logout-auth.service";

@Injectable({
  providedIn: 'root'
})
export class SafeGraphqlService {

  constructor(
    private apollo: Apollo,
    private toastController: ToastController,
    private graphqlService: GraphqlService,
    private logoutAuthService: LogoutAuthService,
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
      await this.graphqlService.checkAuthTokenToBeRefreshedAndRefresh(query);
    }
    catch (e) {
      throw e;
    }

    return await this.apollo
      .query(queryOptions)
      .pipe(
        catchError(err => {
          if (DataHelper.isNotEmpty(err.networkError)) {
            console.log('Network error');
            console.log(err);
          }
          if (DataHelper.isNotEmpty(err.graphQLErrors)) {
            console.log('GraphQL error');
            console.log(err);
            if (err.message === "Your request was made with invalid credentials.") {
              this.toastController.create({
                message: 'Session expired',
                duration: 3000
              }).then(toast => {
                toast.present();
              });

              this.logoutAuthService.logout();
            }
            const message = (err.graphQLErrors[0] && err.graphQLErrors[0]['message']) ? err.graphQLErrors[0]['message'] : '';
            if (message && false) {
              this.toastController
                .create({
                  message: message,
                  duration: 4000
                })
                .then(toast => {
                  toast.present();
                });
            }
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
      fetchPolicy: 'no-cache'
    };

    if (variables !== null && variables !== undefined) {
      mutationOptions.variables = variables;
    }

    await this.graphqlService.checkAuthTokenToBeRefreshedAndRefresh(mutation);

    return await this.apollo.mutate(mutationOptions).pipe(
      timeout(60000),
      catchError(err => {

        if (err.name === 'TimeoutError') {
          throw new Error('Mutation timed out');
        }

        if (DataHelper.isNotEmpty(err.networkError)) {
          console.log('Network error');
          console.log(err);
        }

        if (DataHelper.isNotEmpty(err.graphQLErrors)) {
          console.log('GraphQL error');
          console.log(err);
          if (err.message === "Your request was made with invalid credentials.") {
            this.toastController.create({
              message: 'Session expired',
              duration: 3000
            }).then(toast => {
              toast.present();
            });

            this.logoutAuthService.logout();
          }
          const message = (err.graphQLErrors[0] && err.graphQLErrors[0]['message']) ? err.graphQLErrors[0]['message'] : '';
          if (message && false) {
            this.toastController
              .create({
                message: message,
                duration: 4000
              })
              .then(toast => {
                toast.present();
              });
          }
        }

        return throwError(err);
      })
    ).toPromise();
  }

}
