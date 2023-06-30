import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable, throwError} from "rxjs";
import {ITourDate, ITourDates} from "../interfaces/tourDate";
import {GraphqlService} from "./graphql.service";
import {IAllContentItem} from "../interfaces/all-content";
import {environment} from "../../environments/environment";
import {CheckBatchGuestsMutation, GetUserTokenMutation} from "../../graphql/mutations";
import {catchError, map, tap} from "rxjs/operators";
import {DataHelper} from "../helpers/data.helper";
import {GetNearTourDatesWithGuestsQuery, GetTourDateWithGuestsQuery} from "../../graphql/queries";
import {Storage} from '@ionic/storage-angular';
import {IGuest, IGuests} from "../interfaces/guest";
import {IPurchaser, IPurchasers} from "../interfaces/purchaser";
import {SafeGraphqlService} from "./safe-graphql.service";

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
  public updateEventProcessing = null;

  constructor(
    private storage: Storage,
    private safeGraphql: SafeGraphqlService
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
           eventCity: tourDateApi['eventCity'],
           purchasers: [],
           guests: []
         }

         const tdPurchasers = [];
         const tdGuests = [];

         if (tourDateApi['purchasers']) {
           tourDateApi['purchasers'].forEach((tdPurchaser) => {

             let details = [];
             try {
               details = JSON.parse(tdPurchaser['details']);
             }
             catch (e) {}

             const purchaser: IPurchaser = {
               id: tdPurchaser['id'],
               firstName: tdPurchaser['firstName'],
               lastName: tdPurchaser['lastName'],
               email: tdPurchaser['email'],
               tourDateInstanceId: tdPurchaser['tourDateInstanceId'],
               guestsCount: tdPurchaser['guestsCount'],
               checkedInGuests: tdPurchaser['checkedInGuests'],
               notes: tdPurchaser['notes'],
               details: details
             }
             tdPurchasers.push(purchaser);
             purchasers.push(purchaser);
           });
         }

         if (tourDateApi['guests']) {
           tourDateApi['guests'].forEach((tdGuest) => {
             const foundPurchaser = tdPurchasers.find((td) => td.id === tdGuest['purchaserId']);
             if (foundPurchaser) {

               if (tdGuest['checkedAt']) {
                 console.log(tdGuest['firstName'] + tdGuest['lastName']);
                 console.log((new Date(tdGuest['checkedAt'])));
               }

               const guest: IGuest = {
                 id: tdGuest['id'],
                 firstName: tdGuest['firstName'],
                 lastName: tdGuest['lastName'],
                 email: tdGuest['email'],
                 code: tdGuest['code'],
                 purchaserId: tdGuest['purchaserId'],
                 isCheckedIn: tdGuest['isCheckedIn'],
                 checkedAt: tdGuest['checkedAt'],
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

     return tourDates;
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

  public getAppUserFromStorage() {
    return this.getData(environment.storageName+'.appUser');
  }

  public saveAppUserToStorage(user) {
    return this.setData(environment.storageName+'.appUser', user);
  }

  public saveSelectedTdToStorage(tourDateInstanceId) {
    return this.setData(environment.storageName+'.selectedTourDate', tourDateInstanceId);
  }

  public getSelectedTdFromStorage() {
    return this.getData(environment.storageName+'.selectedTourDate');
  }

  public removeSelectedTdFromStorage() {
    this.currentTourDateInstanceId = null;
    this.selectedTourDateSubject$.next(null);
    return this.removeData(environment.storageName+'.selectedTourDate');
  }


  protected queryTourDates(): Observable<any> {
    return from(
      this.safeGraphql.runQuery(GetNearTourDatesWithGuestsQuery, {})
    ).pipe(
      map(result => ({
        // @ts-ignore
        data: result.data.getNearTourDatesWithGuests
      })),
      tap((res: any) => {

      }),
      catchError(err => {
        return throwError(err);
      })
    );
  }

  loadContent() {
    return this.queryTourDates()
      .pipe(
        map(result => ({
          // @ts-ignore
          data: result.data.data
        })),
        tap((res) => {

          const tourDates = res["data"];

          const parsedTourDates = this.parseTourDates(tourDates);

          this.saveTourDatesToStorage(parsedTourDates);
        })
      );
  }

  public parseTourDate(tourDateApi) {

    const guests = [];
    const purchasers = [];

    let tourDate: ITourDate = {
      instanceId: tourDateApi['instanceId'],
      name: tourDateApi['name'],
      eventDate: tourDateApi['eventDate'],
      eventCity: tourDateApi['eventCity'],
      purchasers: [],
      guests: []
    }

    const tdPurchasers = [];
    const tdGuests = [];

    if (tourDateApi['purchasers']) {
      tourDateApi['purchasers'].forEach((tdPurchaser) => {

        let details = [];
        try {
          details = JSON.parse(tdPurchaser['details']);
        } catch (e) {
        }

        const purchaser: IPurchaser = {
          id: tdPurchaser['id'],
          firstName: tdPurchaser['firstName'],
          lastName: tdPurchaser['lastName'],
          email: tdPurchaser['email'],
          tourDateInstanceId: tdPurchaser['tourDateInstanceId'],
          guestsCount: tdPurchaser['guestsCount'],
          checkedInGuests: tdPurchaser['checkedInGuests'],
          notes: tdPurchaser['notes'],
          details: details
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
            checkedAt: tdGuest['checkedAt'],
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

    const tourDates = [];
    const oldTourDates = this.tourDatesSubject$.value;
    if (oldTourDates) {
      oldTourDates.forEach((td) => {
        if (td.instanceId === tourDate.instanceId) {
          tourDates.push(tourDate);
        } else {
          tourDates.push({...td});
        }
      });
    }

    if (this.currentTourDateInstanceId && tourDate.instanceId === this.currentTourDateInstanceId) {
      this.selectedTourDateSubject$.next(tourDate);
    }
    this.tourDatesSubject$.next(tourDates);

    return tourDates;
  }

  async updateCurrentTourDate() {
    if (this.currentTourDateInstanceId && !this.updateEventProcessing) {

      console.log('update current event');
      this.updateEventProcessing = true;

      try {
        const result = await this.queryUpdateCurrentTourDate(this.currentTourDateInstanceId);
        if (result && result.result === 'ok' && result["data"]) {
          const tourDate = result.data.find((td) => td.instanceId === this.currentTourDateInstanceId);
          if (tourDate) {
            const tourDates = this.parseTourDate(tourDate);
            this.saveTourDatesToStorage(tourDates);
          }
        }
      } catch (e) {

      } finally {
        console.log('update current event done');
        this.updateEventProcessing = false;
      }
    }
  }

  async queryUpdateCurrentTourDate(instanceId) {
    const response = await this.safeGraphql.runMutation(GetTourDateWithGuestsQuery, {
      instanceId: instanceId,
      rnd: Math.floor(Math.random()*1000),
    });
    const responseData = <any>response.data;
    return responseData.getTourDateWithGuests;
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
        this.currentTourDateInstanceId = tdId;
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

  public getPurchaserDetails(purchaser: IPurchaser) {
    let output = [];
    if (purchaser && purchaser['details']) {
      const purchaserDetails = purchaser['details'];
      if (typeof purchaserDetails === 'object') {
        for (const property in purchaserDetails) {
          if (purchaserDetails[property]) {
            output.push(`${property}: ${purchaserDetails[property]}`);
          }
        }
      }
    }
    return output;
  }

  async updateGuestCheckInStatus(tourDates: ITourDates, tourDate: ITourDate, guestId: number, checkedIn: boolean) {
     if (tourDates && tourDate) {
       const guests = tourDate.guests;
       const foundGuest = guests.find((guest) => guest.id === guestId);
       if (foundGuest) {
         foundGuest.isCheckedIn = checkedIn;
         await this.saveTourDatesToStorage(tourDates);
       }
     }
  }

}
