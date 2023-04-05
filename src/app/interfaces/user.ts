import { IAny } from "./any";

export interface IUserAttribute {
  name: string;
  value: string;
}

export interface IUserItem extends IAny {
  id: number;
  name: string;
  email: string;
  photo: string;
  roles: string[];
  firstName: string;
  lastName: string;
  currentDate: string;
  premium: boolean;
  attributes: IUserAttribute[];
  stat: any;
}



