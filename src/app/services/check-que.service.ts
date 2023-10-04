import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable} from "rxjs";
import {checkType, ICheck, ICheckInOut, ICheckRegister, IChecks} from "../interfaces/check";
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
      guestId: guest.id,
      code: code,
      email: guest.email,
      purchaserId: guest.purchaserId,
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

  protected createNewCheckRegister(guest: IGuest, code, data, uid = null) {
    const details: ICheckRegister = {
      isPurchaserGuest: guest.isPurchaserGuest,
      data: data,
    }
    const check: ICheck = {
      uid: uid ? uid : uuidv4(),
      guestId: guest.id,
      code: code,
      email: guest.email,
      purchaserId: guest.purchaserId,
      created_at: "" + Math.floor((new Date()).getTime()/1000),
      processed: false,
      processed_at: '',
      result: '',
      error: '',
      type: "register",
      details: details
    };
    return check;
  }

  public cleanUnprocessedCheckInOut(guestId, code) {
    const oldChecks = this.checks.filter((check) => check.guestId === guestId && check.code === code && check.processed === false && check.type=== 'checkInOut');
    oldChecks.forEach((oldCheck) => {
      const ind = this.checks.findIndex((check) => check === oldCheck);
      if (ind !== -1) {
        this.checks.splice(ind, 1);
      }
    });
  }

  async register(guest: IGuest, registerData, uid = null) {

    const newCheck = this.createNewCheckRegister(guest, guest.token, registerData, uid);
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
        const response = await this.queryRegister(registerData);

        data['response'] = response;

        newCheck.processed = true;
        const ind = this.checks.findIndex((check) => check.uid === newCheck.uid && check.created_at === newCheck.created_at);
        if (ind !== -1) {
          this.checks.splice(ind, 1);
          await this.saveChecksToStorage();
          await this.loadChecksFromStorage();

        }

        return data;
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

  async checkIn(currentTourDate, guestId, code, guest, uid = null) {
    this.cleanUnprocessedCheckInOut(guestId, code);
    const newCheck = this.createNewCheckInOut(guest, code, true, uid);

    this.checks.push(newCheck);
    await this.saveChecksToStorage();
    await this.loadChecksFromStorage();

    let data = 'ok';

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

  async checkOut(currentTourDate, guestId, code, guest, uid = null) {
    this.cleanUnprocessedCheckInOut(guestId, code);
    const newCheck = this.createNewCheckInOut(guest, code, false, uid);
    this.checks.push(newCheck);
    await this.saveChecksToStorage();
    await this.loadChecksFromStorage();

    let data = 'ok';

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

      if (typeId === "register") {
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

      const result = await this.queryCheckBatchGuests(JSON.stringify(checks));
      if (result.result === 'ok') {

        const processedChecks = result.checks;

        let isChanged = false;
        processedChecks.forEach((processedCheck) => {
          const ind = checks.findIndex((check) => check.uid === processedCheck.uid);
          if (ind !== -1) {
            const mainInd = this.checks.findIndex((check) => check === checks[ind]);
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

        if (isChanged) {
          await this.saveChecksToStorage();
        }
      }
    } catch (err) {
      //log network/timeout/etc here, don't close check
      console.log(err);
    }
  }

  async processCheckRegister(check: ICheck) {

    let processResult = 'ok';
    const registerData = check.details['data'];


    try {
      registerData['mode'] = 'que';
      const response = await this.queryRegister(registerData);

      const result = response.data['submitForm'];
      if (result.errors !== null && result.errors.length > 0) {
        // log logic errors here
      } else {
        console.log(result);
      }

      const mainInd = this.checks.findIndex((ch) => ch.uid === check.uid);
      this.checks[mainInd].processed = true;
      this.checks[mainInd].processed_at = (new Date()).toISOString();
      this.checks[mainInd].result = JSON.stringify(result);

      await this.saveChecksToStorage();

    } catch (err) {
      //log network/timeout/etc here, don't close check
      console.log(err);
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
              if (processResult === 'error') {
                // stop processing due to has network or timeout errors
                break;
              }
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
            const ind = checks.findIndex((check) => check.guestId === processedCheck.guestId && check.code === processedCheck.code);
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
      this.periodTask = setInterval(() => {
        console.log('check started');
        this.processQue().then(() => {
            console.log('check done');
            this.dataService.updateCurrentTourDate();
          },
          (err) => {
            console.log('check error');
          });
      }, environment.updatePeriod * 1000)
    }
  }

  public stopPeriodicalChecks() {
    clearInterval(this.periodTask);
    this.periodTask = null;
    this.checkInProcess = false;
    this.dataService.updateEventProcessing = false;
  }

  protected updateCheckRegister(guests, check: ICheck, tourDate: ITourDate) {

    const foundGuest = guests.find((guest) => guest.token === check.code && guest.id === check.guestId);
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
  }

  protected updateCheckInOut(guests, check: ICheck) {
    const foundGuest = guests.find((guest) => guest.token === check.code && guest.id === check.guestId);
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
        if (!check.processed) {

          if (check.type === 'checkInOut') {
            this.updateCheckInOut(guests, check);
          }
          if (check.type === 'register') {
            this.updateCheckRegister(guests, check, tourDate);
          }

        }
      });
    }
    return tourDate;
  }

}
