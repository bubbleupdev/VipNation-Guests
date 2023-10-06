import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogService {

  protected data: Array<any>;

  constructor() { }

  public static log(message: string, data: any = null) {
    console.log('..............')
    console.log(message);
    if (data) {
      console.log(data);
    }
    console.log('``````````````')
  }


}
