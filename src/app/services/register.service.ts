import { Injectable } from '@angular/core';
import {ITourDate, ITourDates} from "../interfaces/tourDate";
import {DataService} from "./data.service";
import {IGuest} from "../interfaces/guest";
import {LogService} from "./log.service";
import {downFirstLetter, upFirstLetter} from "../helpers/data.helper";

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  constructor(
    private dataService: DataService
  ) { }

  async updateGuestIsRegisteredStatus(tourDates: ITourDates, tourDate: ITourDate, guestId: number) {
    if (tourDates && tourDate) {
      const guests = tourDate.guests;
      const foundGuest = guests.find((guest) => guest.id === guestId);
      if (foundGuest) {
        foundGuest.isRegistered = true;
        await this.dataService.saveTourDatesToStorage(tourDates);
      }
    }
  }

  protected mergeGuestFromResponse(currentGuest, responseGuest) {
      if (currentGuest && responseGuest) {
        for (const attr in currentGuest) {
          if (responseGuest[attr]) {
            currentGuest[attr] = responseGuest[attr];
          }
        }
      }
  }


  async updatePurchaserGuestsFromRegister(tourDates: ITourDates, tourDate: ITourDate, purchaserGuest: IGuest, newGuests: IGuest[]) {
    if (tourDates && tourDate) {
      const purchaser = tourDate.purchasers.find((p) => p.id === purchaserGuest.purchaserId);
      const purchaserId = purchaser.id;
      let wasChanges = false;

      LogService.log('updatePurchaserGuestsFromRegister', newGuests);

      if (purchaser) {
        if (purchaser.extraGuests>0) {
          const filterPurchaserGuests = tourDate.guests.filter(g => g.purchaserId === purchaserGuest.purchaserId);
          LogService.log('filterPurchaserGuests', filterPurchaserGuests);

          if (newGuests) {
            newGuests.forEach(newGuest => {
              if (!newGuest.isPurchaserGuest) {
                let foundGuest = filterPurchaserGuests.find(fg => fg.purchaserId === purchaserId && fg.email === newGuest.email);
                if (foundGuest) {
                  this.mergeGuestFromResponse(foundGuest, newGuest);
                }
                else {
                  const createdGuest = this.dataService.createGuest(newGuest, purchaser);
                  tourDate.guests.push(createdGuest);
                  wasChanges = true;
                }
              }
            });
          }
        }
      }
      if (wasChanges) {
        await this.dataService.saveTourDatesToStorage(tourDates);
      }
    }
  }

  createFakeGuests(extraGuests, purchaserGuest, tourDate: ITourDate) {

    const purchaser = tourDate.purchasers.find((p) => p.id === purchaserGuest.purchaserId);
    const purchaserId = purchaser.id;

    let wasChanges = false;
    const cleanExtraGuests = [];
    extraGuests.forEach(extraGuest => {
      let cleanGuest = {};
      for (const attr in extraGuest) {
        const s = attr.split('-')[0];
        const parts = s.split('_');
        const newAttr = downFirstLetter((parts.map((part) => upFirstLetter(part))).join(''));
        cleanGuest[newAttr] = extraGuest[attr];
      }
      cleanExtraGuests.push(cleanGuest);
    });

    cleanExtraGuests.forEach((extraGuest, ind) => {
      let foundGuest = tourDate.guests.find(g => g.purchaserId === purchaserId && g.email === extraGuest['email']);
      if (!foundGuest) {
        tourDate.guests.push(this.dataService.createEmptyGuest(extraGuest, ind, purchaser));
        wasChanges = true;
      }
    });

    return wasChanges;
  }

}
