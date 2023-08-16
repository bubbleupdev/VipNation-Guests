import { Injectable } from "@angular/core";
import {Observable, of, throwError, from, Subject, BehaviorSubject, Subscription, combineLatest} from "rxjs";
import { catchError, flatMap, map, tap } from "rxjs/operators";
import {
  IUserItem,
} from "../interfaces/user";

import { GraphqlService } from "./graphql.service";
import {PlatformService} from "./platform.service";
import {MeQuery} from "../../graphql/queries";
import {DataService} from "./data.service";
import {SafeGraphqlService} from "./safe-graphql.service";


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
    private graphqlService: SafeGraphqlService,
    private dataService: DataService,
    private platformService: PlatformService,
  ) {
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

  callMeApi(): Observable<any> {
    const rnd = Math.floor(Math.random() * 100);
    return from<any>(
      this.graphqlService.runQuery(MeQuery, {rnd: rnd}) as Promise<any>
    ).pipe(
      map( response => (response as any).data.me)
    )
  }

   initCurrentUser(needSetupSubscription = false): Observable<any> {

    const isIos = false; //this.platformService.isIosApp;

    console.log('call me api from init current user');

    return from(
      this.callMeApi()
    ).pipe(
      tap((userData: IUserItem) => {
        if (userData === null || userData === undefined) {
          throw ('err');
        }
        // console.log('got me answer');
        // console.log(userData);
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

    this.user = userData;
    this.dataService.saveAppUserToStorage(userData).then(() => {
      this.currentDate = userData.currentDate;
      this.roles = userData.roles;
      this.userSubject$.next(this.user);
    });


  }



  getCurrentUser(): Observable<IUserItem> {
      return of(this.user);
  }

  setCurrentUser(user: IUserItem) {
    this.user = user;
  }

}
