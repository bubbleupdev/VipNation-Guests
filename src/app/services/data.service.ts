import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable, throwError} from "rxjs";
import {ITourDate, ITourDates} from "../interfaces/tourDate";
import {GraphqlService} from "./graphql.service";
import {IAllContentItem} from "../interfaces/all-content";
import {environment} from "../../environments/environment";
import {
  CheckBatchGuestsMutation,
  CheckInGuestMutation,
  GetUserTokenMutation,
  SendRegistrationEmailMutation, SendSmsToGuestsMutation, UploadLogQuery
} from "../../graphql/mutations";
import {catchError, map, tap} from "rxjs/operators";
import {DataHelper, listColors, uuidv4} from "../helpers/data.helper";
import {GetNearTourDatesWithGuestsQuery, GetTourDateWithGuestsQuery} from "../../graphql/queries";
import {Storage} from '@ionic/storage-angular';
import {IGuest, IGuests} from "../interfaces/guest";
import {IPurchaser, IPurchasers} from "../interfaces/purchaser";
import {SafeGraphqlService} from "./safe-graphql.service";
import {ILogItem, LogService} from "./log.service";
import {IGuestList, IGuestLists} from "../interfaces/guest-list";
import {ICheck} from "../interfaces/check";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public currentRevNum = null;
  protected currentTourDateInstanceId = null;

  public selectedList: IGuestList = null;

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
  public uploadLogProcessing = null;

  constructor(
    private storage: Storage,
    private router: Router,
    private logService: LogService,
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
           qrCode: tourDateApi['eventQrCode'],
           isFavorite: tourDateApi['isFavorite'],
           purchasers: [],
           guests: [],
           lists: tourDateApi['lists'],
           summary: null
         }

         const lists: IGuestLists = [];
         tourDate.lists.forEach(list => {
           lists.push({...list, max: 0, checkedIn: 0});
         });

         const tdPurchasers = [];
         const tdGuests = [];
         let totalGuests = 0;

         if (tourDateApi['purchasers']) {
           tourDateApi['purchasers'].forEach((tdPurchaser) => {

             let details = [];
             try {
               details = JSON.parse(tdPurchaser['details']);
             }
             catch (e) {}

             let isRegistered = false;
             if (tourDateApi['guests']) {
               const purchaserGuest = this.foundPurchaserGuest(tdPurchaser['id'], (tourDateApi['guests']));
               isRegistered = purchaserGuest['isRegistered'];
             }

             const purchaser: IPurchaser = {
               id: tdPurchaser['id'],
               firstName: tdPurchaser['firstName'],
               lastName: tdPurchaser['lastName'],
               email: tdPurchaser['email'],
               phone: tdPurchaser['phone'],
               tourDateInstanceId: tdPurchaser['tourDateInstanceId'],
               guestsCount: tdPurchaser['guestsCount'],
               checkedInGuests: tdPurchaser['checkedInGuests'],
               maxGuests: tdPurchaser['maxGuests'],
               extraGuests: tdPurchaser['extraGuests'],
               waiverRequired: tdPurchaser['waiverRequired'],
               waiverText: tdPurchaser['waiverText'],
               notes: tdPurchaser['notes'],
               details: details,
               isRegistrationSent: tdPurchaser['isRegistrationSent'],
               isRegistered: isRegistered,
               listId: tdPurchaser['listId'],
               isActive: tdPurchaser['isActive'],
               guid: tdPurchaser['guid'],
             }

             // if (false && !isRegistered) {
             //   const guest: IGuest = {
             //     id: tdPurchaser['id'],
             //     firstName: tdPurchaser['firstName'],
             //     lastName: tdPurchaser['lastName'],
             //     email: tdPurchaser['email'],
             //     phone: tdPurchaser['phone'],
             //     tourDateInstanceId: tdPurchaser['tourDateInstanceId'],
             //     code: null,
             //     token: null,
             //     purchaserId: tdPurchaser['id'],
             //     isCheckedIn: false,
             //     checkedAt: null,
             //     purchaser: {...purchaser},
             //     isPurchaserGuest: true,
             //     isRegistered: false,
             //     registeredAt: null,
             //     listId: tdPurchaser['listId'],
             //     isActive: false
             //   }
             //   tdGuests.push(guest);
             //   guests.push(guest);
             // }
             totalGuests += purchaser.maxGuests;
             const foundList = lists.find(list => list.id === purchaser.listId);
             if (foundList) {
               foundList.max += purchaser.maxGuests;
             }

             tdPurchasers.push(purchaser);
             purchasers.push(purchaser);
           });
         }

         let checkedInCount = 0;

         if (tourDateApi['guests']) {
           tourDateApi['guests'].forEach((tdGuest) => {
             const foundPurchaser = tdPurchasers.find((td) => td.id === tdGuest['purchaserId']);
             if (foundPurchaser) {

               if (tdGuest['checkedAt']) {
                 // console.log(tdGuest['firstName'] + tdGuest['lastName']);
                 // console.log((new Date(tdGuest['checkedAt'])));
               }

               const guest: IGuest = {
                 id: tdGuest['id'],
                 firstName: tdGuest['firstName'],
                 lastName: tdGuest['lastName'],
                 email: tdGuest['email'],
                 phone: tdGuest['phone'],
                 code: tdGuest['code'],
                 token: tdGuest['token'],
                 purchaserId: tdGuest['purchaserId'],
                 isCheckedIn: tdGuest['isCheckedIn'],
                 checkedAt: tdGuest['checkedAt'],
                 tourDateInstanceId: tdGuest['tourDateInstanceId'],
                 purchaser: foundPurchaser,
                 isPurchaserGuest: tdGuest['isPurchaserGuest'],
                 isRegistered: tdGuest['isRegistered'],
                 registeredAt: tdGuest['registeredAt'],
                 listId: tdGuest['listId'],
                 isActive: tdGuest['isActive'],
                 sameAsMain: tdGuest['sameAsMain'],
                 guid: tdGuest['guid'],
                 notes: tdGuest['notes'],
                 purchaserGuid: foundPurchaser['guid']
               }
               tdGuests.push(guest);
               guests.push(guest);
               if (guest.isCheckedIn) {
                 checkedInCount++;

                 const foundList = lists.find(list => list.id === guest.listId);
                 if (foundList) {
                   foundList.checkedIn++;
                 }
               }
             }
           });
         }
         tourDate.purchasers = tdPurchasers;
         tourDate.guests = tdGuests;

//         this.fillEmptyGuestsForPurchasers(tourDate);

         tourDate.summary = {
           totalGuests: totalGuests,
           checkedInCount: checkedInCount,
           tourDateInstanceId: tourDate.instanceId,
           lists: lists
         };

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

  public removeAppUserFromStorage() {
    return this.removeData(environment.storageName+'.appUser');
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

  public foundPurchaserGuest(purchaserId, guests) {
    let result = false;
    if (guests) {
      const found = guests.find((guest) => (guest['purchaserId'] === purchaserId && guest['isPurchaserGuest'] === true));
      result = !!found;
    }
    return result;
  }

  public parseTourDate(tourDateApi) {

    const guests = [];
    const purchasers = [];

    let tourDate: ITourDate = {
      instanceId: tourDateApi['instanceId'],
      name: tourDateApi['name'],
      eventDate: tourDateApi['eventDate'],
      eventCity: tourDateApi['eventCity'],
      qrCode: tourDateApi['eventQrCode'],
      isFavorite: tourDateApi['isFavorite'],
      purchasers: [],
      guests: [],
      lists: tourDateApi['lists'],
      summary: null
    }

    const tdPurchasers = [];
    const tdGuests = [];
    let totalGuests = 0;

    const lists: IGuestLists = [];
    tourDate.lists.forEach(list => {
      lists.push({...list, max: 0, checkedIn: 0});
    });

    if (tourDateApi['purchasers']) {
      tourDateApi['purchasers'].forEach((tdPurchaser) => {

        let details = [];
        try {
          details = JSON.parse(tdPurchaser['details']);
        } catch (e) {
        }

        let isRegistered = false;
        if (tourDateApi['guests']) {
          const purchaserGuest = this.foundPurchaserGuest(tdPurchaser['id'], (tourDateApi['guests']));
          isRegistered = purchaserGuest['isRegistered'];
        }


        const purchaser: IPurchaser = {
          id: tdPurchaser['id'],
          firstName: tdPurchaser['firstName'],
          lastName: tdPurchaser['lastName'],
          email: tdPurchaser['email'],
          phone: tdPurchaser['phone'],
          tourDateInstanceId: tdPurchaser['tourDateInstanceId'],
          guestsCount: tdPurchaser['guestsCount'],
          checkedInGuests: tdPurchaser['checkedInGuests'],
          maxGuests: tdPurchaser['maxGuests'],
          extraGuests: tdPurchaser['extraGuests'],
          waiverRequired: tdPurchaser['waiverRequired'],
          waiverText: tdPurchaser['waiverText'],
          notes: tdPurchaser['notes'],
          details: details,
          isRegistrationSent: tdPurchaser['isRegistrationSent'],
          isRegistered: isRegistered,
          listId: tdPurchaser['listId'],
          isActive: tdPurchaser['isActive'],
          guid: tdPurchaser['guid'],
        }
        totalGuests += purchaser.maxGuests;

        const foundList = lists.find(list => list.id === purchaser.listId);
        if (foundList) {
          foundList.max += purchaser.maxGuests;
        }

        tdPurchasers.push(purchaser);
        purchasers.push(purchaser);
      });
    }

    let checkedInCount = 0;

    if (tourDateApi['guests']) {
      tourDateApi['guests'].forEach((tdGuest) => {
        const foundPurchaser = tdPurchasers.find((td) => td.id === tdGuest['purchaserId']);
        if (foundPurchaser) {
          const guest: IGuest = {
            id: tdGuest['id'],
            firstName: tdGuest['firstName'],
            lastName: tdGuest['lastName'],
            email: tdGuest['email'],
            phone: tdGuest['phone'],
            code: tdGuest['code'],
            token: tdGuest['token'],
            purchaserId: tdGuest['purchaserId'],
            isCheckedIn: tdGuest['isCheckedIn'],
            checkedAt: tdGuest['checkedAt'],
            tourDateInstanceId: tdGuest['tourDateInstanceId'],
            purchaser: foundPurchaser,
            isPurchaserGuest: tdGuest['isPurchaserGuest'],
            isRegistered: tdGuest['isRegistered'],
            registeredAt: tdGuest['registeredAt'],
            listId: tdGuest['listId'],
            isActive: tdGuest['isActive'],
            sameAsMain: tdGuest['sameAsMain'],
            guid: tdGuest['guid'],
            notes: tdGuest['notes'],
            purchaserGuid: foundPurchaser['guid']
          }
          tdGuests.push(guest);
          guests.push(guest);
          if (guest.isCheckedIn) {
            checkedInCount++;

            const foundList = lists.find(list => list.id === guest.listId);
            if (foundList) {
              foundList.checkedIn++;
            }
          }
        }
      });
    }
    tourDate.purchasers = tdPurchasers;
    tourDate.guests = tdGuests;
    // this.fillEmptyGuestsForPurchasers(tourDate);

    tourDate.summary = {
      totalGuests: totalGuests,
      checkedInCount: checkedInCount,
      tourDateInstanceId: tourDate.instanceId,
      lists: lists
    };

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

  public fillEmptyGuestsForPurchasers(tourDate: ITourDate) {

    if (tourDate) {
      tourDate.guests = tourDate.guests.filter(g => g.isActive);

      const existingGuests = tourDate.guests || [];
      const guestsByPurchaser = new Map<number, IGuest[]>();

      existingGuests.forEach(guest => {
        const list = guestsByPurchaser.get(guest.purchaserId) || [];
        list.push(guest);
        guestsByPurchaser.set(guest.purchaserId, list);
      });
      tourDate.purchasers.forEach(purchaser => {
        const existing = guestsByPurchaser.get(purchaser.id) || [];
        const toCreate = purchaser.maxGuests - existing.length;

        for (let i = 0; i < toCreate; i++) {
          const id = 0;
          const guest: IGuest = {
            id: id,
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            code: null,
            token: null,
            purchaserId: purchaser.id,
            isCheckedIn: false,
            checkedAt: null,
            tourDateInstanceId: purchaser.tourDateInstanceId,
            purchaser: purchaser,
            isPurchaserGuest: false,
            isRegistered: false,
            registeredAt: null,
            listId: purchaser.listId,
            isActive: false,
            sameAsMain: false,
            guid: uuidv4(),
            notes: '',
            purchaserGuid: purchaser.guid
          };
          tourDate.guests.push(guest);
        }
      });

      this.reCalcEventCounts(tourDate);
    }
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
            await this.saveTourDatesToStorage(tourDates);
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

  public syncTourDates(tourDates) {
    this.tourDatesSubject$.next(tourDates);
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

  public selectEvent(event: ITourDate, list: IGuestList = null) {
    this.selectedList = null;
    this.saveSelectedTdToStorage(event.instanceId).then(() => {
      this.getSelectedTdFromStorage().then((tdId) => {
        // console.log('tdId '+ tdId);
        this.currentTourDateInstanceId = tdId;
        this.selectedTourDateSubject$.next(event);
        this.selectedList = list;
        this.router.navigate(['/home'], {replaceUrl: true});
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

  public getPurchasePkg(purchaser: IPurchaser) {
    let pkg = null;
    if (purchaser && purchaser['details']) {
      const purchaserDetails = purchaser['details'];
      if (typeof purchaserDetails === 'object') {
        for (const property in purchaserDetails) {
          if (property === 'pkg' && purchaserDetails[property]) {
            pkg = purchaserDetails[property]
            break;
          }
        }
      }
    }
    return pkg;
  }

  public getPurchaserDetails(purchaser: IPurchaser) {
    let output = [];
    if (purchaser) {
      // output.push(`Purchaser Email: ${purchaser.email}`);
      if (purchaser.phone) {
        // output.push(`Purchaser Phone: ${purchaser.phone}`);
      }

      if (purchaser['details']) {
        const purchaserDetails = purchaser['details'];
        if (typeof purchaserDetails === 'object') {
          for (const property in purchaserDetails) {
            if (property === 'pkg') {}
            else {
              if (purchaserDetails[property]) {
                output.push(`${property}: ${purchaserDetails[property]}`);
              }
            }
          }
        }
      }
    }
    return output;
  }

  async updateGuestIsRegisteredStatus(tourDates: ITourDates, tourDate: ITourDate, guestGuid: string) {
    if (tourDates && tourDate) {
      const guests = tourDate.guests;
      const foundGuest = guests.find((guest) => guest.guid === guestGuid);
      if (foundGuest) {
        foundGuest.isRegistered = true;
        await this.saveTourDatesToStorage(tourDates);
      }
    }
  }

  async updateGuestCheckInStatus(tourDates: ITourDates, tourDate: ITourDate, guestGuid: string, checkedIn: boolean) {
     if (tourDates && tourDate) {
       const guests = tourDate.guests;
       const foundGuest = guests.find((guest) => guest.guid === guestGuid);
       if (foundGuest) {
         foundGuest.isCheckedIn = checkedIn;
         this.reCalcEventCounts(tourDate);
         await this.saveTourDatesToStorage(tourDates);
       }
     }
  }

  public reCalcEventCounts(tourDate: ITourDate) {
    if (tourDate) {
      let totalGuests = 0;
      let checkedInCount = 0;
      const lists: IGuestLists = [];
      tourDate.lists.forEach(list => {
        lists.push({...list, max: 0, checkedIn: 0});
      });

      const purchasers = tourDate.purchasers;
      purchasers.forEach(purchaser => {
        totalGuests += purchaser.maxGuests;

        const foundList = lists.find(list => list.id === purchaser.listId);
        if (foundList) {
          foundList.max += purchaser.maxGuests;
        }

      });

      const guests = tourDate.guests;
      guests.forEach(guest => {
        if (guest.isCheckedIn) {
          checkedInCount++;

          const foundList = lists.find(list => list.id === guest.listId);
          if (foundList) {
            foundList.checkedIn++;
          }

        }
      });
      tourDate.summary = {
        totalGuests: totalGuests,
        checkedInCount: checkedInCount,
        tourDateInstanceId: tourDate.instanceId,
        lists: lists
      }
    }
  }

  async querySendRegistrationEmail(purchaserId) {
    const response = await this.safeGraphql.runMutation(SendRegistrationEmailMutation, {
      purchaserId: purchaserId
    });
    const responseData = <any>response.data;
    return responseData.sendRegistrationEmail;
  }

  async querySendSms(sendType: string, message:string, eventId: number, listId: number = null) {
    const response = await this.safeGraphql.runMutation(SendSmsToGuestsMutation, {
      sendType: sendType,
      message: message,
      tourDateInstanceId: eventId,
      listId: listId
    });
    const responseData = <any>response.data;
    return responseData.sendSmsToGuests;
  }

  public createGuest(tdGuest, purchaser) {
    const guest: IGuest = {
      id: tdGuest['id'],
      firstName: tdGuest['firstName'],
      lastName: tdGuest['lastName'],
      email: tdGuest['email'],
      phone: tdGuest['phone'],
      code: tdGuest['code'],
      token: tdGuest['token'],
      purchaserId: tdGuest['purchaserId'],
      isCheckedIn: tdGuest['isCheckedIn'],
      checkedAt: tdGuest['checkedAt'],
      tourDateInstanceId: tdGuest['tourDateInstanceId'],
      purchaser: purchaser,
      isPurchaserGuest: tdGuest['isPurchaserGuest'],
      isRegistered: tdGuest['isRegistered'],
      registeredAt: tdGuest['registeredAt'],
      listId: tdGuest['listId'],
      isActive: tdGuest['isActive'],
      sameAsMain: tdGuest['sameAsMain'],
      guid: tdGuest['guid'],
      notes: tdGuest['notes'],
      purchaserGuid: purchaser['guid']
    }
    return guest;
  }

  public createPurchaser(tourDateInstanceId, data, guid) {
    const purchaser: IPurchaser = {
      id: data['id'],
      firstName: data['firstName'],
      lastName: data['lastName'],
      email: data['email'],
      phone: data['phone'],
      tourDateInstanceId: tourDateInstanceId,
      guestsCount: data['guestsCount'],
      checkedInGuests: data['checkedInGuests'],
      maxGuests: data['maxGuests'],
      extraGuests: data['extraGuests'],
      waiverRequired: data['waiverRequired'],
      waiverText: data['waiverText'],
      notes: data['notes'],
      details: data['details'],
      isRegistrationSent: data['isRegistrationSent'],
      isRegistered: data['isRegistered'],
      listId: data['listId'],
      isActive: data['isActive'],
      guid: guid
    }
    return purchaser;
  }

  public createEmptyPurchaser(tourDateInstanceId, data, guid) {
    const purchaser: IPurchaser = {
      id: null,
      firstName: data['first_name'],
      lastName: data['last_name'],
      email: data['email'],
      phone: data['phone'],
      tourDateInstanceId: tourDateInstanceId,
      guestsCount: 0,
      checkedInGuests: 0,
      maxGuests: 1, //data['plus_guests'],
      extraGuests: 0,
      waiverRequired: false,
      waiverText: '',
      notes: data['notes'],
      details: data['details'],
      isRegistrationSent: true,
      isRegistered: false,
      listId: data['list_id'],
      isActive: false,
      guid: guid
    }
    return purchaser;
  }

  public createEmptyPurchaserGuest(data, guid, purchaser: IPurchaser) {
    const guest: IGuest = {
      id: null,
      firstName: data['first_name'],
      lastName: data['last_name'],
      email: data['email'],
      phone: data['phone'],
      tourDateInstanceId: purchaser['tourDateInstanceId'],
      code: null,
      token: null,
      purchaserId: purchaser['id'],
      isCheckedIn: false,
      checkedAt: null,
      purchaser: purchaser,
      isPurchaserGuest: true,
      isRegistered: false,
      registeredAt: null,
      listId: purchaser['listId'],
      isActive: true,
      sameAsMain: false,
      guid: guid,
      notes: data['notes'],
      purchaserGuid: purchaser.guid
    }
    return guest;
  }

  public createEmptyGuestFromRegisterCheck(data, num: number, purchaser: IPurchaser) {
    const guest: IGuest = {
      id: null,
      firstName: data['firstName'],
      lastName: data['lastName'],
      email: data['email'],
      phone: data['phone'],
      tourDateInstanceId: purchaser['tourDateInstanceId'],
      code: null,
      token: null,
      purchaserId: purchaser['id'],
      isCheckedIn: false,
      checkedAt: null,
      purchaser: purchaser,
      isPurchaserGuest: false,
      isRegistered: true,
      registeredAt: null,
      listId: purchaser['listId'],
      isActive: true,
      sameAsMain: data['sameAsMainGuest'],
      guid: data['guid'],
      notes: data['notes'],
      purchaserGuid: purchaser.guid
    }
    return guest;
  }


  async queryUploadLog(log: ILogItem[]) {
    const response = await this.safeGraphql.runMutation(UploadLogQuery, {
      log: JSON.stringify(log),
      rnd: Math.floor(Math.random()*1000),
    });
    const responseData = <any>response.data;
    return responseData.uploadLog;
  }

  async uploadLog() {
    const logItems = await this.logService.getItems(100, 600);

    if (logItems.length > 0 && !this.uploadLogProcessing) {

      LogService.log('upload log started');
      this.uploadLogProcessing = true;

      try {
        const result = await this.queryUploadLog(logItems);
        if (result && result.result === 'ok' && result["data"]) {

          let decoded = [];
          try {
            decoded = JSON.parse(result["data"]);
            await this.logService.removeItemsFromLog(decoded);
          }
          catch {
            await LogService.log('upload log answer decode error', result["data"]);
          }
          await LogService.log('upload log done', {uploadedCount: decoded.length});
        }
      } catch (e) {
        await LogService.log('upload log error', e);
      } finally {
        await LogService.log('upload log done');
        this.uploadLogProcessing = false;
      }
    }
  }

  public updateLocalGuestData(tourDates: ITourDates, tourDate: ITourDate, guestGuid: string, updates: Partial<IGuest>) {
    const guest = this.getGuestByGuid(tourDates, tourDate, guestGuid);
    if (guest) {
      Object.assign(guest, updates);
    }
  }

  public getGuestByGuid(tourDates: ITourDates, tourDate: ITourDate, guestGuid: string): IGuest {
    const guests = tourDate.guests;
    return guests.find((guest) => guest.guid === guestGuid);
  }

  public getListColor(tourDate, selectedList) {
    let color = null;
    if (tourDate && selectedList) {
      if (selectedList && selectedList.colorCode) {
        return "#" + selectedList.colorCode;
      }
      const listIndex = tourDate.lists.findIndex(list => list.id === selectedList.id);
      const item = listColors.find(lc => lc.catId == listIndex+1);
      if (item) {
        color = item.color;
      }
    }
    return color;
  }

  public getGuestInfo(guest: IGuest, tourDate) {
    let res = '';
    if (guest.isPurchaserGuest && tourDate) {
      const purchaser = tourDate.purchasers.find(p => p.guid === guest.purchaserGuid);
      if (purchaser) {
        const allGuests = tourDate.guests.filter(g => g.purchaserGuid === guest.purchaserGuid && g.isRegistered);
        const max = purchaser.maxGuests;
        res = allGuests.length + '/' + max;
      }
    }
    return res;
  }

}
