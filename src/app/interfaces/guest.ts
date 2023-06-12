import {IAny} from "./any";
import {IPurchaser} from "./purchaser";
import {ITourDate} from "./tourDate";


export interface IGuest extends IAny{
  id: number
  firstName: string
  lastName: string
  email: string
  purchaserId: number
  code: string
  isCheckedIn: boolean
  tourDateInstanceId: number
  purchaser: IPurchaser
}

export interface IGuests extends Array<IGuest>{

}

