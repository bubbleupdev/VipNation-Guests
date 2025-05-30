import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable} from "rxjs";
import {checkType, ICheck, ICheckInOut, ICheckRegister, IChecks, ICheckUpdatePurchaser} from "../interfaces/check";
import {DataService} from "./data.service";
import {environment} from "../../environments/environment";
import {
  CheckBatchGuestsMutation,
  CheckInGuestMutation,
  CheckOutGuestMutation, submitFormMutation,

} from "../../graphql/mutations";
import {SafeGraphqlService} from "./safe-graphql.service";
import {ITourDate} from "../interfaces/tourDate";
import {IGuest} from "../interfaces/guest";
import {uuidv4} from "../helpers/data.helper";
import {RegisterService} from "./register.service";
import {LogService} from "./log.service";
import {IPurchaser} from "../interfaces/purchaser";



@Injectable({
  providedIn: 'root'
})
export class CheckQueService {

  public checks$: Observable<IChecks>;
  public checksSubject$: BehaviorSubject<IChecks>;

  protected checks: IChecks = [];

  protected checkInProcess = null;

  protected periodTask = null;

  constructor(
    private dataService: DataService,
    private safeGraphql: SafeGraphqlService,
    private registerService: RegisterService
  ) {
    this.initSubscriptions();
  }

  protected initSubscriptions() {
    this.checksSubject$ = new BehaviorSubject<IChecks>([] as any);
    this.checks$ = this.checksSubject$.asObservable();
  }

  async loadChecksFromStorage() {
    let checks = await this.dataService.getData(environment.storageName+'.checks');
    if (!checks) {
      checks = [];
    }
    this.checks = checks;
    this.checksSubject$.next(checks);
    return checks;
  }

  public saveChecksToStorage() {
    const checks = this.checks;
    return this.dataService.setData(environment.storageName+'.checks', checks);
  }

  // protected createNewCheck(guestId, code, checkInOut: boolean) {
  //   const check: ICheck = {
  //     guestId: guestId,
  //     code: code,
  //     checkInOut: checkInOut,
  //     created_at: "" + Math.floor((new Date()).getTime()/1000),
  //     processed: false,
  //     processed_at: '',
  //     result: ''
  //   };
  //   return check;
  // }

  protected createNewCheckInOut(guest: IGuest, code, checkInOut: boolean, uid = null) {
    const details: ICheckInOut = {
      checkInOut: checkInOut,
    }
    const check: ICheck = {
      uid: uid ? uid : uuidv4(),
      guest_id: guest.id,
      guestGuid: guest.guid,
      code: code,
      email: guest.email,
      purchaserId: guest.purchaserId,
      tourDateInstanceId: guest.tourDateInstanceId,
      isPurchaserGuest: guest.isPurchaserGuest,
      created_at: "" + Math.floor((new Date()).getTime()/1000),
      processed: false,
      processed_at: '',
      result: '',
      error: '',
      type: "checkInOut",
      details: details
    };
    return check;
  }

  protected createNewCheckRegister(guest: IGuest, code, data, uid = null, onlyUpdate: boolean = false) {
    const details: ICheckRegister = {
      isPurchaserGuest: guest.isPurchaserGuest,
      data: data,
    }
    const check: ICheck = {
      uid: uid ? uid : uuidv4(),
      guest_id: guest.id,
      guestGuid: guest.guid,
      isPurchaserGuest: guest.isPurchaserGuest,
      tourDateInstanceId: guest.tourDateInstanceId,
      code: code,
      email: guest.email,
      purchaserId: guest.purchaserId,
      created_at: "" + Math.floor((new Date()).getTime()/1000),
      processed: false,
      processed_at: '',
      result: '',
      error: '',
      type: "register",
      onlyUpdate: onlyUpdate,
      details: details
    };
    return check;
  }

  protected createNewCheckUpdatePurchaser(purchaser: IPurchaser, data,  onlyUpdate = false) {
    const details: ICheckUpdatePurchaser = {
      purchaserGuid: purchaser.guid,
      data: data,
    }
    const check: ICheck = {
      uid: uuidv4(),
      guest_id: null,
      guestGuid: data['guestGuid'],
      isPurchaserGuest: true,
      tourDateInstanceId: purchaser.tourDateInstanceId,
      code: null,
      email: purchaser.email,
      purchaserId: purchaser.id,
      created_at: "" + Math.floor((new Date()).getTime()/1000),
      processed: false,
      processed_at: '',
      result: '',
      error: '',
      type: "updatePurchaser",
      listId: purchaser.listId,
      onlyUpdate: onlyUpdate,
      purchaserGuid: purchaser.guid,
      details: details
    };
    return check;
  }

  public cleanUnprocessedCheckInOut(guestGuid :string, code) {
    const oldChecks = this.checks.filter((check) => check.guestGuid === guestGuid && check.code === code && check.processed === false && check.type=== 'checkInOut');
    oldChecks.forEach((oldCheck) => {
      const ind = this.checks.findIndex((check) => check === oldCheck);
      if (ind !== -1) {
        this.checks.splice(ind, 1);
      }
    });
  }

  async updatePurchaser(purchaser: IPurchaser, updateData, onlyUpdate = false) {
    const newCheck = this.createNewCheckUpdatePurchaser(purchaser, updateData, onlyUpdate);
    this.checks.push(newCheck);
    await this.saveChecksToStorage();
    await this.loadChecksFromStorage();
    let data = {
      result: 'ok',
      errors: null,
      response: null,
      updateData: updateData
    }

    if (!this.checkInProcess) {
      this.checkInProcess = true;
      try {
        updateData['mode'] = 'online';
        const cuttedCheck = {...newCheck};
        cuttedCheck['details'] = null;
        updateData['check'] = cuttedCheck;

        await LogService.log('Query update purchaser from form', updateData);

        const response = await this.queryUpdatePurchaser(updateData);

        data['response'] = response;

        await LogService.log('Query update purchaser success', response);

        newCheck.processed = true;
        const ind = this.checks.findIndex((check) => check.uid === newCheck.uid && check.created_at === newCheck.created_at);
        if (ind !== -1) {
          this.checks.splice(ind, 1);
          await this.saveChecksToStorage();
          await this.loadChecksFromStorage();

        }
        return data;
      } catch (err) {
        await LogService.log('Query update purchaser error', err);
        data['result'] = 'error';
        data['error'] = err;
      } finally {
        this.checkInProcess = false;
      }
    } else {
      console.log('checkIn in process');
    }

    return data;
  }


    async register(guest: IGuest, registerData, uid = null, onlyUpdate = false) {

      const newCheck = this.createNewCheckRegister(guest, guest.token, registerData, uid, onlyUpdate);
      this.checks.push(newCheck);
      await this.saveChecksToStorage();
      await this.loadChecksFromStorage();
      let data = {
        result: 'ok',
        errors: null,
        response: null,
        registerData: registerData
      }

      if (!this.checkInProcess) {
        this.checkInProcess = true;
        try {
          registerData['mode'] = 'online';
          const cuttedCheck = {...newCheck};
          cuttedCheck['details'] = null;
          registerData['check'] = cuttedCheck;

          await LogService.log('Query register from form', registerData);

          const response = await this.queryRegister(registerData);

          data['response'] = response;

          await LogService.log('Query register success', response);

          newCheck.processed = true;
          const ind = this.checks.findIndex((check) => check.uid === newCheck.uid && check.created_at === newCheck.created_at);
          if (ind !== -1) {
            this.checks.splice(ind, 1);
            await this.saveChecksToStorage();
            await this.loadChecksFromStorage();

          }

          return data;
        } catch (err) {
          await LogService.log('Query register error', err);
          data['result'] = 'error';
          data['error'] = err;
        } finally {
          this.checkInProcess = false;
        }
      } else {
        console.log('checkIn in process');
      }

      return data;
    }

  async checkIn(currentTourDate, guestGuid: string, code, guest, uid = null) {
    this.cleanUnprocessedCheckInOut(guestGuid, code);
    const newCheck = this.createNewCheckInOut(guest, code, true, uid);

    this.checks.push(newCheck);
    await this.saveChecksToStorage();
    await this.loadChecksFromStorage();

    let data = 'ok';
    await LogService.log('Start checkin', newCheck);

    if (!this.checkInProcess) {
      this.checkInProcess = true;

      try {
        await this.processCheckInOut([newCheck]);
        // this.queryCheckIn(code).then(async (data) => {
        //     if (data) {
        //       if (data['result'] === 'ok') {
        //         newCheck.processed = true;
        //         const ind = this.checks.findIndex((check) => check.code === newCheck.code && check.guestId === newCheck.guestId && check.created_at === newCheck.created_at);
        //         if (ind !== -1) {
        //           this.checks.splice(ind, 1);
        //           await this.saveChecksToStorage();
        //           await this.loadChecksFromStorage();
        //         }
        //       }
        //     }
        //     this.checkInProcess = false;
        //   },
        //   err => {
        //     console.log(err);
        //     this.checkInProcess = false;
        //   },
        // );
      } catch (err) {

        console.log(err);
        data['result'] = 'error';
        data['error'] = err;
      } finally {
        this.checkInProcess = false;
      }
    } else {
      console.log('checkIn in process');
    }

    return data;
  }

  async checkOut(currentTourDate, guestGuid: string, code, guest, uid = null) {
    this.cleanUnprocessedCheckInOut(guestGuid, code);
    const newCheck = this.createNewCheckInOut(guest, code, false, uid);
    this.checks.push(newCheck);
    await this.saveChecksToStorage();
    await this.loadChecksFromStorage();

    let data = 'ok';
    await LogService.log('Start checkout', newCheck);

    if (!this.checkInProcess) {
      this.checkInProcess = true;
      try {
        await this.processCheckInOut([newCheck]);

        // this.queryCheckOut(code).then(async (data) => {
        //     if (data === 'ok') {
        //       newCheck.processed = true;
        //       const ind = this.checks.findIndex((check) => check.code === newCheck.code && check.guestId === newCheck.guestId && check.created_at === newCheck.created_at);
        //       if (ind !== -1) {
        //         this.checks.splice(ind, 1);
        //         await this.saveChecksToStorage();
        //         await this.loadChecksFromStorage();
        //       }
        //     }
        //     this.checkInProcess = false;
        //   },
        //   err => {
        //     this.checkInProcess = false;
        //   },
        // );
      } catch (err) {

        console.log(err);
        data['result'] = 'error';
        data['error'] = err;
      } finally {
        this.checkInProcess = false;
      }
    } else {
      console.log('checkOut in process');
    }

    return data;
  }

  async queryCheckIn(code) {
    const response = await this.safeGraphql.runMutation(CheckInGuestMutation, {
      code: code
    });
    const responseData = <any>response.data;
    return responseData.checkInGuest;
  }

  async queryCheckOut(code) {
    const response = await this.safeGraphql.runMutation(CheckOutGuestMutation, {
      code: code
    });
    const responseData = <any>response.data;
    return responseData.checkOutGuest;
  }

  async queryRegister(data) {
    try {
      const response = await this.safeGraphql.runMutation(submitFormMutation, {
        data: {
          formData: JSON.stringify(data),
          formPath: "VnAppEventRegistrationForm"
        }
      })

      return response;
    }
    catch (e) {
      console.log('register query error');
      console.log(e);
      throw e;
    }
  }

  async queryUpdatePurchaser(data) {
    try {
      const response = await this.safeGraphql.runMutation(submitFormMutation, {
        data: {
          formData: JSON.stringify(data),
          formPath: "VnUpdatePurchaserForm"
        }
      })

      return response;
    }
    catch (e) {
      console.log('update purchaser query error');
      console.log(e);
      throw e;
    }
  }

  protected* getNext(que: ICheck[]) {
    let ind = 0;
    let checks = [];
    let prevTypeId: checkType = null;
    let typeId: checkType = null;

    while (ind < que.length) {
      const check = que[ind];

      typeId = check.type;
      if (prevTypeId && prevTypeId !== typeId) {
        if (prevTypeId === 'checkInOut') {
          let tt = prevTypeId;
          let cc = checks;
          prevTypeId = null;
          checks = [];
          yield {
            typeId: tt,
            data: cc
          }
        }
      }

      if (typeId === "register" || typeId === "updatePurchaser") {
        yield {
          typeId: typeId,
          data: check
        }
      }
      else if (typeId === "checkInOut") {
        prevTypeId = typeId;
        checks.push(check);
      }
      ind++;
    }

    if (typeId === "checkInOut") {
      let tt = typeId;
      let cc = checks;
      typeId = null;
      checks = [];
      yield {
        typeId: tt,
        data: cc
      }
    }
  }

  async processCheckInOut(checks: ICheck[]) {

    try {
      await LogService.log('Query check in/out', checks);
      const result = await this.queryCheckBatchGuests(JSON.stringify(checks));
      if (result.result === 'ok') {
        await LogService.log('check in/out success', result);
        const processedChecks = result.checks;

        let isChanged = false;
        if (processedChecks && processedChecks.length>0) {
          processedChecks.forEach((processedCheck) => {
            if (processedCheck['result'] !== 'skip') {
              const mainInd = this.checks.findIndex((check) => check.uid === processedCheck.uid);
              this.checks[mainInd].processed = true;
              this.checks[mainInd].processed_at = (new Date()).toISOString();
              this.checks[mainInd].result = processedCheck['result'];
              // if (mainInd !== -1) {
              //   this.checks.splice(mainInd,1);
              // }
//            checks.splice(ind, 1);
              isChanged = true;
            }
          });
        }
        if (isChanged) {
          await this.saveChecksToStorage();
        }
      }
    } catch (err) {
      //log network/timeout/etc here, don't close check
      await LogService.log('check in/out error', err);

      console.log(err);
    }
  }

  async processCheckUpdatePurchaser(check: ICheck) {
    let processResult = 'ok';
    const updatePurchaserData = check.details['data'];

    const cuttedCheck = {...check};
    cuttedCheck['details'] = null;

    try {
      updatePurchaserData['mode'] = 'que';
      updatePurchaserData['check'] = cuttedCheck;

      await LogService.log('Query update purchaser from que', updatePurchaserData);

      const response = await this.queryUpdatePurchaser(updatePurchaserData);

      const result = response.data['submitForm'];
      if (result.errors !== null && result.errors.length > 0) {
        await LogService.log('update purchaser logic errors', result.errors);

        // log logic errors here
      } else {
        await LogService.log('update purchaser success', result);
      }

      const mainInd = this.checks.findIndex((ch) => ch.uid === check.uid);
      this.checks[mainInd].processed = true;
      this.checks[mainInd].processed_at = (new Date()).toISOString();
      this.checks[mainInd].result = JSON.stringify(result);

      await this.saveChecksToStorage();

    } catch (err) {
      //log network/timeout/etc here, don't close check
      await LogService.log('update purchaser error', err);
      processResult = 'error';
    }

    return processResult;
  }

  async processCheckRegister(check: ICheck) {

    let processResult = 'ok';
    const registerData = check.details['data'];

    const cuttedCheck = {...check};
    cuttedCheck['details'] = null;

    try {
      registerData['mode'] = 'que';
      registerData['check'] = cuttedCheck;

      await LogService.log('Query register from que', registerData);

      const response = await this.queryRegister(registerData);

      const result = response.data['submitForm'];
      if (result.errors !== null && result.errors.length > 0) {
        await LogService.log('register logic errors', result.errors);

        // log logic errors here
      } else {
        await LogService.log('register success', result);
      }

      const mainInd = this.checks.findIndex((ch) => ch.uid === check.uid);
      this.checks[mainInd].processed = true;
      this.checks[mainInd].processed_at = (new Date()).toISOString();
      this.checks[mainInd].result = JSON.stringify(result);

      await this.saveChecksToStorage();

    } catch (err) {
      //log network/timeout/etc here, don't close check
      await LogService.log('register error', err);
      processResult = 'error';
    }

    return processResult;
  }


  async processQue() {

    const checks = this.checks.filter((check) => check.processed === false);

    if (!this.checkInProcess && checks.length > 0) {
      this.checkInProcess = true;
      try {
        const iterator = this.getNext(checks);

        let val;
        while ((val = iterator.next().value) !== undefined) {
          if (val) {
            if (val['typeId'] === 'checkInOut') {
              await this.processCheckInOut(val['data']);
            }
            if (val['typeId'] === 'register') {
              const processResult = await this.processCheckRegister(val['data']);
              // if (processResult === 'error') {
              //   // stop processing due to has network or timeout errors
              //   break;
              // }
            }
            if (val['typeId'] === 'updatePurchaser') {
              const processResult = await this.processCheckUpdatePurchaser(val['data']);
            }
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        await this.loadChecksFromStorage();
        this.checkInProcess = false;
      }
    }

    return true;

  }

  /**
   * @deprecated
   */
  async checkBatch() {

   const checks = this.checks.filter((check) => check.processed === false && check.type==="checkInOut");

//     const checks = [];
//
//     if (this.checks.length>0) {
//        for(let i=0; i < this.checks.length; i++) {
// //         if (this.checks[i].type )
//        }
//     }

    if (!this.checkInProcess && checks.length>0) {
      this.checkInProcess = true;
      try {
        const result = await this.queryCheckBatchGuests(JSON.stringify(checks));
        if (result.result === 'ok') {

          const processedChecks = result.checks;

          let isChanged = false;
          processedChecks.forEach((processedCheck) => {
            const ind = checks.findIndex((check) => check.guestGuid === processedCheck.guestGuid && check.code === processedCheck.code);
            if (ind !== -1) {
              const mainInd = this.checks.findIndex((check) => check === checks[ind]);
              if (mainInd !== -1) {
                this.checks.splice(mainInd,1);
              }
              checks.splice(ind,1);
              isChanged = true;
            }
          });

          if (isChanged) {
            await this.saveChecksToStorage();
          }
        }
      } catch (e) {
        console.log(e);
      }
      finally {
        await this.loadChecksFromStorage();
        this.checkInProcess = false;
      }
    }

    return true;
  }

  async queryCheckBatchGuests(checks) {
    const response = await this.safeGraphql.runMutation(CheckBatchGuestsMutation, {
      checks: checks,
      rnd: Math.floor(Math.random()*1000),
    });
    const responseData = <any>response.data;
    return responseData.checkBatchGuests;
  }


  public runPeriodicalChecks() {
    this.checkInProcess = false;
    this.dataService.updateEventProcessing = false;

    if (!this.periodTask) {
      this.periodTask = setInterval(async () => {
        await LogService.log('Period task processQue started');
        this.processQue().then(async () => {
            console.log('Period task processQue done');
            await this.dataService.updateCurrentTourDate();
          },
          (err) => {
            console.log('Period task processQue error', err);
          });
        await this.dataService.uploadLog();
      }, environment.updatePeriod * 1000)
    }
  }

  public stopPeriodicalChecks() {
    clearInterval(this.periodTask);
    this.periodTask = null;
    this.checkInProcess = false;
    this.dataService.updateEventProcessing = false;
  }

  public updateCheckUpdate(guests, check: ICheck, tourDate: ITourDate) {

    // const isUpdate = check['onlyUpdate'];
    const purchaserGuid = check['purchaserGuid'];
    const guestGuid = check['guestGuid'];
    const data = check.details['data'];

    let foundPurchaser = tourDate.purchasers.find((p) => p.guid === purchaserGuid);

    const checkedPurchaser = this.dataService.createEmptyPurchaser(tourDate.instanceId, data, purchaserGuid);

    if (foundPurchaser) {
      this.registerService.mergePurchaserFromResponse(foundPurchaser, checkedPurchaser);
    } else {
      foundPurchaser = {...checkedPurchaser};
      tourDate.purchasers.push(foundPurchaser);
    }

    let foundGuest = guests.find((guest) => guest.guid === guestGuid);

    const checkedGuest = this.dataService.createEmptyPurchaserGuest(data, guestGuid, foundPurchaser)

    if (foundGuest) {
      this.registerService.mergeGuestFromResponse(foundGuest, checkedGuest);
    } else {
      foundGuest = {...checkedGuest};
      tourDate.guests.push(foundGuest);
    }

    this.dataService.reCalcEventCounts(tourDate);
  }

  protected updateCheckRegister(guests, check: ICheck, tourDate: ITourDate) {
    // let foundGuest = guests.find((guest) => guest.token === check.code && guest.guid === check.guestGuid);
    let foundGuest = guests.find((guest) => guest.guid === check.guestGuid);
    // if (!foundGuest && check.guest_id<0) {
    //   foundGuest = guests.find((guest) => guest.guid === check.guestGuid && guest.purchaserId === check.purchaserId);
    // }
    if (foundGuest) {
      const guestDt = foundGuest.registeredAt;
      const checkTimestamp = parseInt(check.created_at);
      try {
        const guestTimestamp = Math.floor(((new Date(guestDt)).getTime()) / 1000);
        if (guestTimestamp < checkTimestamp || true) {
          foundGuest.isRegistered = true;
        }
      } catch (e) {
      }

      const details = check['details'];
      if (details['isPurchaserGuest']) {
        const registerData = details['data'];
        if (registerData && registerData['extraGuestsObjects']) {
          const extraGuestsObjects = registerData['extraGuestsObjects'];
          this.registerService.createFakeGuests(extraGuestsObjects, foundGuest, tourDate);
        }
      }
    }
    else {
      let wasChanges = false;

      const purchaser = tourDate.purchasers.find((p) => p.id === check.purchaserId);
      if (purchaser) {
        const createdGuest = this.buildGuestDataFromCheck(check, purchaser);
        tourDate.guests.push(createdGuest);
        wasChanges = true;
      }

      if (wasChanges) {
        this.dataService.reCalcEventCounts(tourDate);
      }
    }
  }

  protected updateCheckInOut(guests, check: ICheck) {
    let foundGuest = guests.find((guest) => guest.token === check.code && guest.guid === check.guestGuid);
    if (!foundGuest && check.guest_id<0) {
      foundGuest = guests.find((guest) => guest.guid === check.guestGuid && guest.purchaserId === check.purchaserId);
    }
    if (foundGuest) {
      const guestDt = foundGuest.checkedAt;
      const checkTimestamp = parseInt(check.created_at);
      try {
        const guestTimestamp = Math.floor(((new Date(guestDt)).getTime())/1000);
        if (guestTimestamp < checkTimestamp) {
          foundGuest.isCheckedIn = check.details['checkInOut'];
        }
      }
      catch (e) {
      }
    }
  }

  public updateTourDateWithStoredChecks(tourDate: ITourDate) {
    if (this.checks && tourDate) {
      const guests = tourDate.guests;
      this.checks.forEach((check) => {
        if (!check.processed && check.tourDateInstanceId === tourDate.instanceId) {

          if (check.type === 'checkInOut') {
            this.updateCheckInOut(guests, check);
          }
          if (check.type === 'register') {
            this.updateCheckRegister(guests, check, tourDate);
          }
          if (check.type === 'updatePurchaser') {
            this.updateCheckUpdate(guests, check, tourDate);
          }

        }
      });
    }
    return tourDate;
  }

  public buildGuestDataFromCheck(check: ICheck, purchaser: IPurchaser) {
    const data = check.details['data'];
    const guest: IGuest = {
      id: check.guest_id,
      firstName: data['first_name'],
      lastName: data['last_name'],
      email: data['email'],
      phone: data['phone'],
      code: data['code'],
      token: null,
      purchaserId: purchaser.id,
      isCheckedIn: false,
      checkedAt: null,
      tourDateInstanceId: purchaser.tourDateInstanceId,
      purchaser: purchaser,
      isPurchaserGuest: check.isPurchaserGuest,
      isRegistered: true,
      registeredAt: null,
      listId: purchaser.listId,
      isActive: true,
      sameAsMain: data['sameAsMain'],
      guid: check.guestGuid,
      notes: data['notes'],
      purchaserGuid: purchaser.guid
    }
    return guest;
  }

}
