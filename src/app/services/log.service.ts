import { Injectable } from '@angular/core';
import {Storage} from "@ionic/storage";
import { Drivers } from '@ionic/storage';
import {DataHelper, uuidv4} from "../helpers/data.helper";
import {BehaviorSubject, Observable} from "rxjs";
import {IChecks} from "../interfaces/check";

export interface ILogItem {
  dt: number
  isoTime: string
  userId: number
  sessionId: string
  message: string
  data: any|null
}

@Injectable({
  providedIn: 'root'
})
export class LogService {

  public static logCount: Observable<number>;
  public static logCountSubject$: BehaviorSubject<number>;

  protected data: Array<any>;
  protected static sessionId: string = '';
  protected static logStorage: Storage = null;
  protected static userId: number = null;

  constructor() {
    LogService.sessionId = uuidv4();
    this.loadAsync();
    this.initSubscriptions();
  }


  async initSubscriptions() {
    LogService.logCountSubject$ = new BehaviorSubject<number>(0);
    LogService.logCount = LogService.logCountSubject$.asObservable();
    const logcnt = await LogService.logStorage.length();
    console.log('logcnt ' + logcnt);
    LogService.logCountSubject$.next(await LogService.logStorage.length());
  }

  private loadAsync = async () => {
    LogService.logStorage = new Storage({
      name: '__vnLogStore',
      storeName: 'logdb',
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
    });

    await LogService.logStorage.create();
  };

  public static regenerateSessionId() {
    LogService.sessionId = uuidv4();
  }

  public static setUserId(userId) {
    this.userId = userId;
  }

  static async logToStore(message: string, data: any = null) {
    const dt = (new Date());
    const timestamp = dt.getTime();
    const record: ILogItem = {
      dt: timestamp, //dt.toISOString(),
      isoTime: dt.toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      message: message,
      data: data,
    }
    await LogService.logStorage.set(timestamp + '', record);
  }

   static async log(message: string, data: any = null) {
    console.log('..............')
    console.log(message);
    if (data) {
      console.log(data);
    }
    await LogService.logToStore(message, data);
    console.log('``````````````');
    LogService.logCountSubject$.next(await LogService.logStorage.length());
  }

  async getItems(cnt: number = 100, olderThan: number = 600): Promise<ILogItem[]> {
    const log = [];
    const keys = await LogService.logStorage.keys();
    const len = (keys.length < cnt) ? keys.length : cnt;
    for (let i = 0; i < cnt; i++) {
      const logItem = await LogService.logStorage.get(keys[i]);
      log.push(logItem);
    }
    return log;
  }

  async removeItemsFromLog(processed) {
    for (let item in processed) {
      await LogService.logStorage.remove(processed[item]+'');
    }
    LogService.logCountSubject$.next(await LogService.logStorage.length());
  }
}
