import { Injectable } from '@angular/core';
import {BehaviorSubject, from, Observable} from "rxjs";
import {ITourDate, ITourDates} from "../interfaces/tourDate";
import {ICheck, IChecks} from "../interfaces/check";
import {DataService} from "./data.service";
import {GraphqlService} from "./graphql.service";
import {environment} from "../../environments/environment";
import {CheckInGuestMutation, CheckOutGuestMutation, GetUserTokenMutation} from "../../graphql/mutations";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class CheckQueService {

  public checks$: Observable<IChecks>;
  public checksSubject$: BehaviorSubject<IChecks>;

  protected checks: IChecks = [];

  constructor(
    private dataService: DataService,
    private graphqlService: GraphqlService
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
      checkInOut: true,
      created_at: new Date().toUTCString(),
      processed: false,
      processed_at: '',
      result: ''
    };
    return check;
  }

  async checkIn(currentTourDate, guestId, code) {
    this.checks.push(this.createNewCheck(guestId, code, true));
    await this.saveChecksToStorage();
    // todo - save check id and after saving update status in store
    const data = await this.queryCheckIn(code);
    console.log(data);
    return data;
  }

  async checkOut(currentTourDate, guestId, code) {
    this.checks.push(this.createNewCheck(guestId, code, false));
    await this.saveChecksToStorage();
    const data = await this.queryCheckOut(code);
    console.log('checkout ' + data);
    return data;
  }

  async queryCheckIn(code) {
    const response = await this.graphqlService.runMutation(CheckInGuestMutation, {
      code: code
    });
    const responseData = <any>response.data;
    return responseData.checkInGuest;
  }

  async queryCheckOut(code) {
    const response = await this.graphqlService.runMutation(CheckOutGuestMutation, {
      code: code
    });
    const responseData = <any>response.data;
    return responseData.checkOutGuest;
  }


}
