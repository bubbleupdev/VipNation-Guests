import {IAny} from "./any";
import {IPurchasers} from "./purchaser";
import {IGuests} from "./guest";

export interface ICheckInOut {
  checkInOut: boolean;
}

export interface IFakeCheckInOut {
  checkInOut: boolean;
}

export interface ICheckExtraGuest {
  fakeId: number
  purchaserId: number
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface ICheckRegister {
  isPurchaserGuest: boolean
  data: any
}

export type checkType = | 'checkInOut' | 'register' | 'fakeCheckInOut'

export interface ICheck extends IAny{
  uid: string
  guestGuid: string
  guest_id: number
  code: string
  email: string
  purchaserId: number
  created_at: string
  processed: boolean
  processed_at: string
  result: string
  error: string
  isPurchaserGuest: boolean
  type: checkType
  details: ICheckInOut | ICheckRegister | IFakeCheckInOut
}

export interface IChecks extends Array<ICheck>{

}
