import {IAny} from "./any";

export interface IPurchaser  extends IAny{
  id: number
  firstName: string
  lastName: string
  email: string
  tourDateInstanceId: number
  guestsCount: number
  checkedInGuests: number
  maxGuests: number
  extraGuests: number
  waiverRequired: boolean
  waiverText: string
  notes: string
  details: any
  isRegistrationSent: boolean;
  isRegistered: boolean;
}

export interface IPurchasers extends Array<IPurchaser>{

}
