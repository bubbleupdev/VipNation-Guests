import {IAny} from "./any";

export interface IPurchaser  extends IAny{
  id: number
  firstName: string
  lastName: string
  email: string
  tourDateInstanceId: number
  guestsCount: number
  checkedInGuests: number
  notes: string
  details: any
  isRegistrationSent: boolean;
  isRegistered: boolean;
}

export interface IPurchasers extends Array<IPurchaser>{

}
