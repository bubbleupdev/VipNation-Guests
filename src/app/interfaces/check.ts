import {IAny} from "./any";
import {IPurchasers} from "./purchaser";
import {IGuests} from "./guest";

export interface ICheck extends IAny{
  guestId: number
  code: string
  checkInOut: boolean;
  created_at: string
  processed: boolean
  processed_at: string
  result: string
}

export interface IChecks extends Array<ICheck>{

}
