import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable} from "rxjs";
import {ICheck, IChecks} from "../interfaces/check";
import {DataService} from "./data.service";
import {environment} from "../../environments/environment";
import {
  CheckBatchGuestsMutation,
  CheckInGuestMutation,
  CheckOutGuestMutation,

} from "../../graphql/mutations";
import {SafeGraphqlService} from "./safe-graphql.service";
import {ITourDate} from "../interfaces/tourDate";

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
    private safeGraphql: SafeGraphqlService
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

  protected createNewCheck(guestId, code, checkInOut: boolean) {
    const check: ICheck = {
      guestId: guestId,
      code: code,
      checkInOut: checkInOut,
      created_at: "" + Math.floor((new Date()).getTime()/1000),
      processed: false,
      processed_at: '',
      result: ''
    };
    return check;
  }

  public cleanUnporcessedChecks(guestId, code) {
    const oldChecks = this.checks.filter((check) => check.guestId === guestId && check.code === code && check.processed === false);
    oldChecks.forEach((oldCheck) => {
      const ind = this.checks.findIndex((check) => check === oldCheck);
      if (ind !== -1) {
        this.checks.splice(ind, 1);
      }
    });
  }


  async checkIn(currentTourDate, guestId, code) {
    this.cleanUnporcessedChecks(guestId, code);
    const newCheck = this.createNewCheck(guestId, code, true);
    this.checks.push(newCheck);
    await this.saveChecksToStorage();
    await this.loadChecksFromStorage();

    let data = 'ok';

    if (!this.checkInProcess) {
      this.checkInProcess = true;
      this.queryCheckIn(code).then(async (data) => {
          if (data === 'ok') {
            newCheck.processed = true;
            const ind = this.checks.findIndex((check) => check.code === newCheck.code && check.guestId === newCheck.guestId && check.created_at === newCheck.created_at);
            if (ind !== -1) {
              this.checks.splice(ind, 1);
              await this.saveChecksToStorage();
              await this.loadChecksFromStorage();
            }
          }
          this.checkInProcess = false;
        },
        err => {
          this.checkInProcess = false;
        },
      );
    }

    console.log(data);
    return data;
  }

  async checkOut(currentTourDate, guestId, code) {
    this.cleanUnporcessedChecks(guestId, code);
    const newCheck = this.createNewCheck(guestId, code, false);
    this.checks.push(newCheck);
    await this.saveChecksToStorage();
    await this.loadChecksFromStorage();

    let data = 'ok';

    if (!this.checkInProcess) {
      this.checkInProcess = true;
      this.queryCheckOut(code).then(async (data) => {
          if (data === 'ok') {
            newCheck.processed = true;
            const ind = this.checks.findIndex((check) => check.code === newCheck.code && check.guestId === newCheck.guestId && check.created_at === newCheck.created_at);
            if (ind !== -1) {
              this.checks.splice(ind, 1);
              await this.saveChecksToStorage();
              await this.loadChecksFromStorage();
            }
          }
          this.checkInProcess = false;
        },
        err => {
          this.checkInProcess = false;
        },
      );
    }

    console.log('checkout ' + data);
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


  async checkBatch() {

    const checks = this.checks.filter((check) => check.processed === false);

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
        this.checkBatch().then(() => {
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

  public updateTourDateWithStoredChecks(tourDate: ITourDate) {
    if (this.checks && tourDate) {
      const guests = tourDate.guests;
      this.checks.forEach((check) => {
        if (!check.processed) {
          const foundGuest = guests.find((guest) => guest.code === check.code && guest.id === check.guestId);
          if (foundGuest) {
            const guestDt = foundGuest.checkedAt;
            const checkTimestamp = parseInt(check.created_at);
            try {
              const guestTimestamp = Math.floor(((new Date(guestDt)).getTime())/1000);
              if (guestTimestamp < checkTimestamp) {
                 foundGuest.isCheckedIn = check.checkInOut;
              }
            }
            catch (e) {
            }
          }
        }
      });
    }
    return tourDate;
  }

}
