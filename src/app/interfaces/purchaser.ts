import {IAny} from "./any";

export interface IPurchaser  extends IAny{
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
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
  listId: number;
  isActive: boolean;
  guid: string;
}

export interface IPurchasers extends Array<IPurchaser>{

}
