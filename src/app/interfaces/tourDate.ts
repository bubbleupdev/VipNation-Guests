import {IAny} from "./any";
import {IPurchasers} from "./purchaser";
import {IGuests} from "./guest";

export interface ITourDate extends IAny{
  instanceId: number
  name: string
  eventDate: string
  city: string
  purchasers: IPurchasers
  guests: IGuests
}

export interface ITourDates extends Array<ITourDate>{

}
