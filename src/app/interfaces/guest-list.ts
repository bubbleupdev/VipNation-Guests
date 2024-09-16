import {IAny} from "./any";

export interface IGuestList  extends IAny{
  id: number
  eventId: number
  title: string,
  max: number,
  checkedIn: number
}

export interface IGuestLists extends Array<IGuestList>{
}
