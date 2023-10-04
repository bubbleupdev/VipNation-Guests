import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogService {

  protected data: Array<any>;

  constructor() { }

  public static log(message: string, data: any) {
    console.log('..............')
    console.log(message);
    console.log(data);
    console.log('``````````````')
  }


}
