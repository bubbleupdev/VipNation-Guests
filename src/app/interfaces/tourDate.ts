import {IAny} from "./any";
import {IPurchasers} from "./purchaser";
import {IGuests} from "./guest";
import {IEventSummary} from "./event-summary";

export interface ITourDate extends IAny{
  instanceId: number
  name: string
  eventDate: string
  eventCity: string
  purchasers: IPurchasers
  guests: IGuests
  summary: IEventSummary
}

export interface ITourDates extends Array<ITourDate>{

}
