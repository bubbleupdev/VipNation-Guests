import {IAny} from "./any";
import {IPurchaser} from "./purchaser";
import {ITourDate} from "./tourDate";


export interface IGuest extends IAny{
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  purchaserId: number
  code: string
  token: string
  isCheckedIn: boolean
  checkedAt: string
  tourDateInstanceId: number
  purchaser: IPurchaser
  isPurchaserGuest: boolean;
  isRegistered: boolean;
  registeredAt: string;
  listId: number;
  isActive: boolean;
  sameAsMain: boolean;
  guid: string;
  notes: string;
}

export interface IGuests extends Array<IGuest>{

}

