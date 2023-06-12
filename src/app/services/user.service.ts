import { Injectable } from "@angular/core";
import {Observable, of, throwError, from, Subject, BehaviorSubject, Subscription, combineLatest} from "rxjs";
import { catchError, flatMap, map, tap } from "rxjs/operators";
import {
  IUserItem,
} from "../interfaces/user";

import { GraphqlService } from "./graphql.service";
import {PlatformService} from "./platform.service";
import {CheckMeQuery, MeQuery} from "../../graphql/queries";



@Injectable({
  providedIn: "root"
})
export class UserService {

  protected user: IUserItem | null;

  public user$: Observable<IUserItem>;
  public userSubject$: BehaviorSubject<IUserItem>;

  public currentDate = '';
  public roles = [];

  protected sub: Subscription;

  constructor(
    private graphqlService: GraphqlService,
    private platformService: PlatformService,
  ) {
    console.log('user service construct');
    this.userSubject$ = new BehaviorSubject<IUserItem>({} as any);
    this.user$ = this.userSubject$.asObservable();

    this.subscribeToMe();

    if (this.sub) {
      // unsub from sub in UserService
      this.sub.unsubscribe();
    }
  }

  subscribeToMe() {
    this.user$.subscribe(user => {
    });
  }

  callCheckMeApi(platform, params): Observable<any> {
    return from<any>(
      this.graphqlService.runQuery(CheckMeQuery, {platform: platform, params: params}) as Promise<any>
    ).pipe(
      map( response => (response as any).data.checkMe)
    )
  }

  callMeApi(): Observable<any> {
    return from<any>(
      this.graphqlService.runQuery(MeQuery, {}) as Promise<any>
    ).pipe(
      map( response => (response as any).data.me)
    )
  }

   initCurrentUser(needSetupSubscription = false): Observable<any> {

    const isIos = false; //this.platformService.isIosApp;

    return from(
      isIos ? this.callCheckMeApi('ios','') : this.callMeApi()
    ).pipe(
      tap((userData: IUserItem) => {
        if (userData === null || userData === undefined) {
          throw ('err');
        }
        this.parseUser(userData);

      }),
      catchError(err => {
        return throwError(err);
      })
    );
  }

  public parseUser(uData) {

    let rawUserData = {...uData};

    let userData: IUserItem = {...rawUserData};

    try {
      const rawStat = JSON.parse(userData.stat);
      userData.stat = rawStat;
    }
    catch (e) {
      userData.stat = null;
    }

    let newUserData = userData;
    userData = newUserData;

    this.user = userData;

    this.currentDate = userData.currentDate;
    this.roles = userData.roles;
    this.userSubject$.next(this.user);

  }



  getCurrentUser(): Observable<IUserItem> {
      return of(this.user);
  }

  setCurrentUser(user: IUserItem) {
    this.user = user;
  }

}
