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

  async updateGuestIsRegisteredStatus(tourDates: ITourDates, tourDate: ITourDate, guestGuid: string) {
    if (tourDates && tourDate) {
      const guests = tourDate.guests;
      const foundGuest = guests.find((guest) => guest.guid === guestGuid);
      if (foundGuest) {
        foundGuest.isRegistered = true;
        await this.dataService.saveTourDatesToStorage(tourDates);
      }
    }
  }

  public mergeGuestFromResponse(currentGuest, responseGuest) {
      if (currentGuest && responseGuest) {
        for (const attr in currentGuest) {
          if (responseGuest[attr]) {
            currentGuest[attr] = responseGuest[attr];
          }
        }
      }
  }

  public mergePurchaserFromResponse(currentPurchaser, responsePurchaser) {
    if (currentPurchaser && responsePurchaser) {
      for (const attr in currentPurchaser) {
        if (attr !== 'guid') {
          if (responsePurchaser[attr]) {
            currentPurchaser[attr] = responsePurchaser[attr];
          }
        }
      }
    }
  }

  async updatePurchaserGuestsFromRegister(tourDates: ITourDates, tourDate: ITourDate, purchaserGuest: IGuest, newGuests: IGuest[]) {
    if (tourDates && tourDate) {
      const purchaser = tourDate.purchasers.find((p) => p.guid === purchaserGuest.purchaserGuid);
      // const purchaserId = purchaser.id;
      const purchaserGuid = purchaser.guid;
      let wasChanges = false;

      LogService.log('updatePurchaserGuestsFromRegister', newGuests);

      if (purchaser) {
        if (true || purchaser.extraGuests>0) {
          const filterPurchaserGuests = tourDate.guests.filter(g => g.purchaserGuid === purchaserGuid);
          LogService.log('filterPurchaserGuests', filterPurchaserGuests);

          if (newGuests) {
            newGuests.forEach(newGuest => {
              // if (!newGuest.isPurchaserGuest) {
                let foundGuest = filterPurchaserGuests.find(fg => fg.purchaserGuid === purchaserGuid && fg.guid === newGuest.guid);
                if (foundGuest) {
                  this.mergeGuestFromResponse(foundGuest, newGuest);
                }
                else {
                  const createdGuest = this.dataService.createGuest(newGuest, purchaser);
                  tourDate.guests.push(createdGuest);
                  wasChanges = true;
                }
              // }
            });
          }
        }
      }
      if (wasChanges) {
        this.dataService.fillEmptyGuestsForPurchasers(tourDate);
        this.dataService.reCalcEventCounts(tourDate);
        await this.dataService.saveTourDatesToStorage(tourDates);
      }
    }
  }


  updateExtraGuests(extraGuests, purchaserGuest, tourDate: ITourDate) {

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
      let foundGuest = tourDate.guests.find(g => g.purchaserId === purchaserId && g.guid === extraGuest['guid']);
      if (foundGuest) {
         foundGuest.firstName = extraGuest['first_name'];
         foundGuest.lastName = extraGuest['last_name'];
         foundGuest.email = extraGuest['email'];
         foundGuest.phone = extraGuest['phone'];
         foundGuest.sameAsMain = extraGuest['sameAsMainGuest'];
         foundGuest.isActive = true;
         foundGuest.notes = extraGuest['notes'];
         foundGuest.isRegistered = true;
         wasChanges = true;
      }
    });

    return wasChanges;
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
      let foundGuest = tourDate.guests.find(g => g.purchaserId === purchaserId && g.guid === extraGuest['guid']);
      if (!foundGuest) {
        tourDate.guests.push(this.dataService.createEmptyGuestFromRegisterCheck(extraGuest, ind, purchaser));
        wasChanges = true;
      }
      else {
        foundGuest.isRegistered = true;
      }
    });

    return wasChanges;
  }

  async createOrUpdatePurchaserWithGuestFromAnswer(tourDates: ITourDates, tourDate: ITourDate, data) {
    if (tourDates && tourDate) {
      debugger;
      const purchaserData = data['purchaser'];
      const guestData = data['extraGuests'];
      const purchaserGuid = purchaserData['guid'];
      let purchaser = tourDate.purchasers.find((p) => p.guid === purchaserGuid);
      let wasChanges = true;

      LogService.log('createOrUpdatePurchaserWithGuestFromAnswer', data);
      if (!purchaser) {
        purchaser = this.dataService.createPurchaser(tourDate.instanceId, data, purchaserGuid);
        tourDate.purchasers.push(purchaser);
      }
      else {
        this.mergePurchaserFromResponse(purchaser, purchaserData);
      }

      const filterPurchaserGuests = tourDate.guests.filter(g => g.purchaserGuid === purchaserGuid);
      LogService.log('filterPurchaserGuests', filterPurchaserGuests);

      if (guestData) {
        guestData.forEach(newGuest => {
          let foundGuest = filterPurchaserGuests.find(fg => fg.purchaserGuid === purchaserGuid && fg.guid === newGuest.guid);
          if (foundGuest) {
            this.mergeGuestFromResponse(foundGuest, newGuest);
          }
          else {
            const createdGuest = this.dataService.createGuest(newGuest, purchaser);
            tourDate.guests.push(createdGuest);
            wasChanges = true;
          }
        });
      }

      if (wasChanges) {
        this.dataService.fillEmptyGuestsForPurchasers(tourDate);
        this.dataService.reCalcEventCounts(tourDate);
        await this.dataService.saveTourDatesToStorage(tourDates);
        this.dataService.syncTourDates(tourDates);
      }
    }
  }

  async createOrUpdatePurchaserWithGuestFromUpdateQueryError(tourDates: ITourDates, tourDate: ITourDate, updateData) {


    // const isUpdate = check['onlyUpdate'];
    const purchaserGuid = updateData['check']['purchaserGuid'];
    const guestGuid = updateData['check']['guestGuid'];

    let foundPurchaser = tourDate.purchasers.find((p) => p.guid === purchaserGuid);

    const checkedPurchaser = this.dataService.createEmptyPurchaser(tourDate.instanceId, updateData, purchaserGuid);

    if (foundPurchaser) {
      this.mergePurchaserFromResponse(foundPurchaser, checkedPurchaser);
    } else {
      foundPurchaser = {...checkedPurchaser};
      tourDate.purchasers.push(foundPurchaser);
    }

    let foundGuest = tourDate.guests.find((guest) => guest.guid === guestGuid);

    const checkedGuest = this.dataService.createEmptyPurchaserGuest(updateData, guestGuid, foundPurchaser)

    if (foundGuest) {
      this.mergeGuestFromResponse(foundGuest, checkedGuest);
    } else {
      foundGuest = {...checkedGuest};
      tourDate.guests.push(foundGuest);
    }

    this.dataService.reCalcEventCounts(tourDate);
    await this.dataService.saveTourDatesToStorage(tourDates);
  }


}
