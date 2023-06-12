import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable, throwError} from "rxjs";
import {ITourDate, ITourDates} from "../interfaces/tourDate";
import {GraphqlService} from "./graphql.service";
import {IAllContentItem} from "../interfaces/all-content";
import {environment} from "../../environments/environment";
import {GetUserTokenMutation} from "../../graphql/mutations";
import {catchError, map, tap} from "rxjs/operators";
import {DataHelper} from "../helpers/data.helper";
import {GetNearTourDatesWithGuestsQuery} from "../../graphql/queries";
import {Storage} from '@ionic/storage-angular';
import {IGuest, IGuests} from "../interfaces/guest";
import {IPurchaser, IPurchasers} from "../interfaces/purchaser";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public currentRevNum = null;
  protected currentTourDateInstanceId = null;

  public selectedTourDate$: Observable<ITourDate>;
  public selectedTourDateSubject$: BehaviorSubject<ITourDate>;

  public tourDates$: Observable<ITourDates>;
  public tourDatesSubject$: BehaviorSubject<ITourDates>;

  public guests$: Observable<IGuests>;
  public guestsSubject$: BehaviorSubject<IGuests>;

  public purchasers$: Observable<IPurchasers>;
  public purchasersSubject$: BehaviorSubject<IPurchasers>;


  private _storage: Storage | null = null;

  constructor(
    private storage: Storage,
    private graphqlService: GraphqlService
  ) {

    this.initSubscriptions();
  }

  protected initSubscriptions() {

    this.selectedTourDateSubject$ = new BehaviorSubject<ITourDate>(null);
    this.selectedTourDate$ = this.selectedTourDateSubject$.asObservable();

    this.tourDatesSubject$ = new BehaviorSubject<ITourDates>([] as any);
    this.tourDates$ = this.tourDatesSubject$.asObservable();

    this.guestsSubject$ = new BehaviorSubject<IGuests>([] as any);
    this.guests$ = this.guestsSubject$.asObservable();

    this.purchasersSubject$ = new BehaviorSubject<IPurchasers>([] as any);
    this.purchasers$ = this.purchasersSubject$.asObservable();

    this.initStorage();
  }


  public parseTourDates(tourDatesApi) {
     const tourDates = [];
     const guests = [];
     const purchasers = [];

     if (tourDatesApi) {
       tourDatesApi.forEach((tourDateApi) => {
         let tourDate: ITourDate = {
           instanceId: tourDateApi['instanceId'],
           name: tourDateApi['name'],
           eventDate: tourDateApi['eventDate'],
           city: '',
           purchasers: [],
           guests: []
         }

         const tdPurchasers = [];
         const tdGuests = [];

         if (tourDateApi['purchasers']) {
           tourDateApi['purchasers'].forEach((tdPurchaser) => {
             const purchaser: IPurchaser = {
               id: tdPurchaser['id'],
               firstName: tdPurchaser['firstName'],
               lastName: tdPurchaser['lastName'],
               email: tdPurchaser['email'],
               tourDateInstanceId: tdPurchaser['tourDateInstanceId'],
               guestsCount: tdPurchaser['guestsCount'],
               checkedInGuests: tdPurchaser['checkedInGuests'],
               notes: tdPurchaser['notes'],
               details: tdPurchaser['details']
             }
             tdPurchasers.push(purchaser);
             purchasers.push(purchaser);
           });
         }

         if (tourDateApi['guests']) {
           tourDateApi['guests'].forEach((tdGuest) => {
             const foundPurchaser = tdPurchasers.find((td) => td.id === tdGuest['purchaserId']);
             if (foundPurchaser) {
               const guest: IGuest = {
                 id: tdGuest['id'],
                 firstName: tdGuest['firstName'],
                 lastName: tdGuest['lastName'],
                 email: tdGuest['email'],
                 code: tdGuest['code'],
                 purchaserId: tdGuest['purchaserId'],
                 isCheckedIn: tdGuest['isCheckedIn'],
                 tourDateInstanceId: tdGuest['tourDateInstanceId'],
                 purchaser: {...foundPurchaser},
               }
               tdGuests.push(guest);
               guests.push(guest);
             }
           });
         }
         tourDate.purchasers = tdPurchasers;
         tourDate.guests = tdGuests;
         tourDates.push(tourDate);

         if (this.currentTourDateInstanceId && tourDate.instanceId === this.currentTourDateInstanceId) {
           this.selectedTourDateSubject$.next(tourDate);
         }
       });

       this.tourDatesSubject$.next(tourDates);
       // this.guestsSubject$.next(guests);
       // this.purchasersSubject$.next(purchasers);
     }
  }

  async getDataFromStorage(): Promise<IAllContentItem[]> {
    let data: IAllContentItem[] = [];

    const allDataString = await this.storage?.['get'](environment.storageName);
    if (allDataString) {
      const allData = (allDataString);

      if (allData) {
        data = allData;
      }
    }

    return data;
  }

  public saveDataToStorage(data) {
    return this.setData(environment.storageName, data);
  }

  async initStorage() {
    // If using, define drivers here: await this.storage.defineDriver(/*...*/);
    const storage = await this.storage['create']();
    this._storage = storage;
  }

  public removeData(key: string) {
    return this.storage['remove'](key);
  }


  public setData(key: string, value: any) {
    return this.storage['set'](key, value);
  }

  public getData(key: string) {
    return this.storage['get'](key);
  }

  public saveTourDatesToStorage(tourDates) {
    return this.setData(environment.storageName+'.tourDates', tourDates);
  }

  public getTourDatesFromStorage() {
    return this.getData(environment.storageName+'.tourDates');
  }

  public saveSelectedTdToStorage(tourDateInstanceId) {
    return this.setData(environment.storageName+'.selectedTourDate', tourDateInstanceId);
  }

  public getSelectedTdFromStorage() {
    return this.getData(environment.storageName+'.selectedTourDate');
  }

  public removeSelectedTdFromStorage() {
    return this.removeData(environment.storageName+'.selectedTourDate');
  }



  protected queryTourDates(): Observable<any> {
    return from(
      this.graphqlService.runQuery(GetNearTourDatesWithGuestsQuery, {})
    ).pipe(
      map(result => ({
        // @ts-ignore
        data: result.data.getNearTourDatesWithGuests
      })),
      tap((res: any) => {


        // if (res === null || res === undefined || res.data.getNearTourDatesWithGuests === null) {
        //   throw ('Error happened');
        // }
        // const data = res.data.getNearTourDatesWithGuests;
        //
        // if (data.result == 'ok') {
        //   return [];
        // }
        // else {
        //   throw (data.error);
        // }

      }),
      catchError(err => {
        return throwError(err);
      })
    );
  }

  async loadContent() {
    this.queryTourDates()
      .pipe(
        map(result => ({
          // @ts-ignore
          data: result.data.data
        })))
      .subscribe((res) => {

      const tourDates = res["data"];

      this.parseTourDates(tourDates);

      this.saveTourDatesToStorage(tourDates);

    });
  }

  public publishData(tourDates, selectedTourDate: ITourDate) {
    if (tourDates) {
      this.tourDatesSubject$.next(tourDates);
    }
    if (selectedTourDate) {
      this.currentTourDateInstanceId = selectedTourDate.instanceId;
      this.selectedTourDateSubject$.next(selectedTourDate);
    }
  }

  public selectEvent(event: ITourDate) {
    this.saveSelectedTdToStorage(event.instanceId).then(() => {
      this.getSelectedTdFromStorage().then((tdId) => {
        console.log('tdId '+ tdId);
        this.selectedTourDateSubject$.next(event);
      });
    });
  }

  public getPurchaserCounts(tourDates: ITourDates, selectedTourDate: ITourDate, purchaserId) {
    if (tourDates) {
      const tourDate = tourDates.find((tds) => tds.instanceId === selectedTourDate.instanceId);
      if (tourDate && tourDate.purchasers) {
        const purchaser = tourDate.purchasers.find((pur) => pur.id === purchaserId);
        if (purchaser && tourDate.guests) {
          const guests = tourDate.guests.filter((guest) => guest.purchaserId === purchaser.id);
          let allCount = guests.length;
          let checkedIn = 0;
          guests.forEach((guest)=> {
            if (guest.isCheckedIn) {
              checkedIn++;
            }
          });
          return checkedIn + " of " + allCount;
        }
      }
    }
    return '';
  }

  async updateGuestCheckInStatus(tourDates: ITourDates, tourDate: ITourDate, guestId: number, checkedIn: boolean) {
     const guests = tourDate.guests;
     const foundGuest = guests.find((guest)=> guest.id === guestId);
     if (foundGuest) {
       foundGuest.isCheckedIn = checkedIn;
       await this.saveTourDatesToStorage(tourDates);
     }
  }

}
