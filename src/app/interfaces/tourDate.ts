import {IAny} from "./any";
import {IPurchasers} from "./purchaser";
import {IGuests} from "./guest";
import {IEventSummary} from "./event-summary";
import {IGuestLists} from "./guest-list";

export interface ITourDate extends IAny{
  instanceId: number
  name: string
  eventDate: string
  eventCity: string
  qrCode: string
  purchasers: IPurchasers
  guests: IGuests
  lists: IGuestLists
  summary: IEventSummary
}

export interface ITourDates extends Array<ITourDate>{

}
