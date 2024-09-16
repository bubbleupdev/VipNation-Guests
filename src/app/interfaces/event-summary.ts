import {IAny} from "./any";
import {IGuestLists} from "./guest-list";


export interface IEventSummary extends IAny{
  tourDateInstanceId: number
  totalGuests: number
  checkedInCount: number,
  lists: IGuestLists
}


