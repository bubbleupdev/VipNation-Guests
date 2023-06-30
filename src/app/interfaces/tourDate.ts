import {IAny} from "./any";
import {IPurchasers} from "./purchaser";
import {IGuests} from "./guest";

export interface ITourDate extends IAny{
  instanceId: number
  name: string
  eventDate: string
  eventCity: string
  purchasers: IPurchasers
  guests: IGuests
}

export interface ITourDates extends Array<ITourDate>{

}
