import { Injectable } from '@angular/core';
import {Apollo} from "apollo-angular";
import {catchError} from "rxjs/operators";
import {DataHelper} from "../helpers/data.helper";
import {throwError} from "rxjs";
import {GraphqlService} from "./graphql.service";

@Injectable({
  providedIn: 'root'
})
export class SafeGraphqlService {

  constructor(
    private apollo: Apollo,
    private graphqlService: GraphqlService
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
      catchError(err => {

        if (DataHelper.isNotEmpty(err.networkError)) {
          console.log('Network error');
          console.log(err);
        }

        return throwError(err);
      })
    ).toPromise();
  }

}
