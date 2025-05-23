import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output, SimpleChanges,
  ViewChild
} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ITourDate, ITourDates} from "../../../interfaces/tourDate";
import {IGuest, IGuests} from "../../../interfaces/guest";
import {SearchService} from "../../../services/search.service";
import {DataService} from "../../../services/data.service";
import {CheckQueService} from "../../../services/check-que.service";
import {IonSearchbar} from "@ionic/angular/directives/proxies";
import {BarcodeScanner, CheckPermissionResult} from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import {Subscription} from "rxjs";
import {RegistrationFormComponent} from "../registration-form/registration-form.component";
import {IPurchaser} from "../../../interfaces/purchaser";
import {LoadingController} from "@ionic/angular";
import {RegisterService} from "../../../services/register.service";
import {FormSubmitService} from "../../../services/form-submit.service";
import {LogService} from "../../../services/log.service";
import {environment} from "../../../../environments/environment";
import {Browser} from "@capacitor/browser";
import {downFirstLetter, upFirstLetter} from "../../../helpers/data.helper";


@Component({
  selector: 'app-lookup-form',
  templateUrl: './lookup-form.component.html',
  styleUrls: ['./lookup-form.component.scss'],
})
export class LookupFormComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  @Input() tourDate: ITourDate = null;
  @Input() guests: IGuests = [];

  @Output() scanOpened: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() stateChanged: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('userSearchBar') searchbar: IonSearchbar;

  @ViewChild('registrationForm') registrationForm: RegistrationFormComponent;

  public mode: "lookup" | "register" | "checkresult" | "update" | "purchaser" | 'add' = 'lookup';
  public registerGuest: IGuest = null;
  public updatePurchaser: IPurchaser = null;

  protected selectedEvent = '';

  public results: IGuest[] = [];
  public selectedGuest: IGuest = null;

  public allGuests: IGuest[] = [];
  public selectedPurchaserGuest: IGuest = null;
//  public selectedGuests: IGuest[] = [];
  public selectedGuests: string[] = []; // guid's list

  public purchaser: IPurchaser = null;

  public searchVal: string = '';

  public tourDates: ITourDates = [];

  public group: FormGroup | undefined;

  public inProgress: boolean = false;
  public checkStatus = null;

  public inScan: boolean = false;
  public inError: boolean = false;

  protected sub: Subscription;

  constructor(
    public formBuilder: FormBuilder,
    public searchService: SearchService,
    public dataService: DataService,
    private loadingCtrl: LoadingController,
    public checkService: CheckQueService,
    public registerService: RegisterService
  ) {
  }


  ngOnInit() {
    this.searchVal = '';
    this.group = this.formBuilder.group({
      guest: ['', [Validators.required]],
    });

    this.sub = this.dataService.tourDates$.subscribe((tourDates) => {
      this.tourDates = tourDates;
//      LogService.log('Update tour dates', tourDates);
      if (!this.selectedGuest) {
        this.results = this.limitNonNullGuests(this.guests, 99);
      }
    });

  }


  public inTest: boolean = false;

  public ngAfterViewInit() {
    // if (this.inTest) {
    //   this.initTest();
    // }
  }


  public initTest() {
    // this.registerGuest = this.guests.find((g) => g.id === 67);
    // this.setMode('checkresult');
    // this.checkStatus = 'registered';

  }

  public testAction() {
    this.initTest();
    console.log(this.selectedGuest);
  }

  public logAction() {

    console.log(this.allGuests);
    this.checkService.processQue();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['guests'] && changes['guests'].currentValue) {
      LogService.log('Update guests in lookup', changes['guests'].currentValue);

      if (this.selectedGuest) {
        const updatedGuest = this.guests.find(g => g.guid === this.selectedGuest.guid);
        if (updatedGuest) {
          this.selectedGuest = updatedGuest;
        }
       this.allGuests = this.getGuests(this.selectedGuest);
       this.selectedPurchaserGuest = this.allGuests.find(guest => guest.isPurchaserGuest);
      }
    }
  }

  async closedUpdatePurchaser(ev) {
    if (ev['result'] === 'ok' || ev['result'] === 'error') {
      if (ev['result'] === 'ok') {
        const result = ev.response.data['submitForm'];
        const data = FormSubmitService.decodeFormResponseData(result);
        await this.registerService.createOrUpdatePurchaserWithGuestFromAnswer(this.tourDates, this.tourDate, data);
      } else {
        const updateData = ev['updateData'];
        if (updateData) {
          this.registerService.createOrUpdatePurchaserWithGuestFromUpdateQueryError(this.tourDates, this.tourDate, updateData);
        }
      }

      this.setMode('lookup');
    } else if (ev['status'] === 'skip') {
      this.setMode('lookup');
      this.checkStatus = '';
    }
  }

  async closedAdd(ev) {
    if (ev['result'] === 'ok' || ev['result'] === 'error') {
      if (ev['result'] === 'ok') {

        const result = ev.response.data['submitForm'];
        const data = FormSubmitService.decodeFormResponseData(result);
        await this.registerService.createOrUpdatePurchaserWithGuestFromAnswer(this.tourDates, this.tourDate, data);
      } else {
        const updateData = ev['updateData'];
        if (updateData) {
          this.registerService.createOrUpdatePurchaserWithGuestFromUpdateQueryError(this.tourDates, this.tourDate, updateData);
        }
      }
      this.setMode('lookup');

    } else if (ev['status'] === 'skip') {
      this.setMode('lookup');
      this.checkStatus = '';
    }
  }

  async closed(ev) {

    if (ev['result'] === 'ok' || ev['result'] === 'error') {
      if (ev['result'] === 'ok') {
        const result = ev.response.data['submitForm'];
        const decodedData = FormSubmitService.decodeFormResponseData(result);
        const newGuests = (decodedData && decodedData['extraGuests']) ? decodedData['extraGuests'] : [];
        await this.registerService.updatePurchaserGuestsFromRegister(this.tourDates, this.tourDate, this.registerGuest, newGuests);
      } else {
        const registerData = ev['registerData'];
        if (registerData) {
          this.registerGuest.firstName = registerData['first_name'];
          this.registerGuest.lastName = registerData['last_name'];
          this.registerGuest.email = registerData['email'];
          this.registerGuest.phone = registerData['phone'];
          this.registerGuest.sameAsMain = registerData['sameAsMainGuest'];
        }
        if (this.registerGuest.isPurchaserGuest) {
        //   const registerData = ev['registerData'];
        //   if (registerData && registerData['extraGuestsObjects']) {
        //     const extraGuestsObjects = registerData['extraGuestsObjects'];
        //     const wasChanges = this.registerService.createFakeGuests(extraGuestsObjects, this.registerGuest, this.tourDate);
        //     if (wasChanges) {
        //       this.dataService.reCalcEventCounts(this.tourDate);
        //       await this.dataService.saveTourDatesToStorage(this.tourDates);
        //     }
        //
        //   }
          const extraGuestsObjects = registerData['extraGuestsObjects'];
          const wasChanges = this.registerService.updateExtraGuests(extraGuestsObjects, this.registerGuest, this.tourDate);

          if (wasChanges) {
            this.dataService.fillEmptyGuestsForPurchasers(this.tourDate);
            this.dataService.reCalcEventCounts(this.tourDate);
            await this.dataService.saveTourDatesToStorage(this.tourDates);
          }
        }

      }

      const sfUrl = environment.salesForceUrl;
      if (ev && ev['registerData']) {
        if (ev['registerData']['mailing_subscribe']) {
          Browser.open({url: sfUrl});
        }
      }

      this.registerService.updateGuestIsRegisteredStatus(this.tourDates, this.tourDate, this.registerGuest.guid).then( async () => {
        await this.checkInAfterRegister(this.registerGuest);
        await this.checkInExtraGuests(ev);

      }).finally(() => {

        this.checkStatus = 'registered';
        this.setMode('checkresult');
        this.choose(this.registerGuest);
        this.dataService.fillEmptyGuestsForPurchasers(this.tourDate);
      });

    } else if (ev['status'] === 'skip') {
      this.setMode('lookup');
      this.checkStatus = '';
    }
  }

  async checkInExtraGuests(ev) {
    const cleanExtraGuests = [];
    const registerData = ev['registerData'] || [];
    const extraGuestsObjects = registerData['extraGuestsObjects'] || [];
    extraGuestsObjects.forEach(extraGuest => {
      let cleanGuest = {};
      for (const attr in extraGuest) {
        const s = attr.split('-')[0];
        const parts = s.split('_');
        const newAttr = downFirstLetter((parts.map((part) => upFirstLetter(part))).join(''));
        cleanGuest[newAttr] = extraGuest[attr];
      }
      cleanExtraGuests.push(cleanGuest);
    });
    const purchaser = this.tourDate.purchasers.find((p) => p.id === this.registerGuest.purchaserId);
    const purchaserId = purchaser.id;
    const guests = [];
    cleanExtraGuests.forEach((extraGuest, ind) => {
      let foundGuest = this.tourDate.guests.find(g => g.purchaserId === purchaserId && g.guid === extraGuest['guid']);
      console.log('Extra found');
      console.log(foundGuest);
      if (foundGuest) {
        guests.push(foundGuest);
      }
    });

    console.log('check in them');
    for (let i=0; i< guests.length; i++) {
      await this.checkInAfterRegister(guests[i]);
    }

  }

  async closedUpdate(ev) {

    if (ev['result'] === 'ok' || ev['result'] === 'error') {
      if (ev['result'] === 'ok') {
        const result = ev.response.data['submitForm'];
        const decodedData = FormSubmitService.decodeFormResponseData(result);
        const newGuests = (decodedData && decodedData['extraGuests']) ? decodedData['extraGuests'] : [];
        await this.registerService.updatePurchaserGuestsFromRegister(this.tourDates, this.tourDate, this.registerGuest, newGuests);
      } else {
        const registerData = ev['registerData'];
        if (registerData) {
          this.registerGuest.firstName = registerData['first_name'];
          this.registerGuest.lastName = registerData['last_name'];
          this.registerGuest.email = registerData['email'];
          this.registerGuest.phone = registerData['phone'];
          this.registerGuest.sameAsMain = registerData['sameAsMainGuest'];
        }
        if (this.registerGuest.isPurchaserGuest) {
          //   const registerData = ev['registerData'];
          //   if (registerData && registerData['extraGuestsObjects']) {
          //     const extraGuestsObjects = registerData['extraGuestsObjects'];
          //     const wasChanges = this.registerService.createFakeGuests(extraGuestsObjects, this.registerGuest, this.tourDate);
          //     if (wasChanges) {
          //       this.dataService.reCalcEventCounts(this.tourDate);
          //       await this.dataService.saveTourDatesToStorage(this.tourDates);
          //     }
          //
          //   }
          const extraGuestsObjects = registerData['extraGuestsObjects'];
          const wasChanges = this.registerService.updateExtraGuests(extraGuestsObjects, this.registerGuest, this.tourDate);

          if (wasChanges) {
            this.dataService.fillEmptyGuestsForPurchasers(this.tourDate);
            this.dataService.reCalcEventCounts(this.tourDate);
            await this.dataService.saveTourDatesToStorage(this.tourDates);
          }
        }

      }

      // const sfUrl = environment.salesForceUrl;
      // if (ev && ev['registerData']) {
      //   if (ev['registerData']['mailing_subscribe']) {
      //     Browser.open({url: sfUrl});
      //   }
      // }

      this.checkStatus = '';
      this.setMode('lookup');
      this.choose(this.registerGuest);
      this.dataService.fillEmptyGuestsForPurchasers(this.tourDate);

    } else if (ev['status'] === 'skip') {
      this.setMode('lookup');
      this.checkStatus = '';
    }
  }

  public showRegister(guest) {
    this.setMode('register');
    console.log(guest);
    this.registerGuest = guest;
  }

  public showAdd() {
    this.setMode('add');
  }

  public showUpdate() {
    if (this.selectedGuests.length !== 1) {
      this.updatePurchaser = this.selectedPurchaserGuest.purchaser;
      this.setMode('purchaser');

    } else {
      const guest = this.allGuests.find(ag => ag.guid === this.selectedGuests[0]);
      if (guest) {
        console.log(guest);
        this.setMode('update');
        this.registerGuest = guest;
      }
    }
  }

  public async processSubmit() {
    return;
  }

  public getGuests(selectedGuest) {
    const all = this.guests.filter(guest => guest.purchaser.id === selectedGuest.purchaserId);
    return all;
  }

  public choose(guest: IGuest) {
    if (guest) {
      const val = guest.firstName + ' ' + guest.lastName + ' ' + guest.email;
      if (this.searchbar) {
        this.searchbar.value = val;
      }
      this.searchVal = val;
    }
    this.allGuests = this.getGuests(guest);
    this.selectedPurchaserGuest = this.allGuests.find(guest => guest.isPurchaserGuest);
//    this.selectedGuest = guest;
   this.selectedGuest = this.allGuests.find(g => g.guid === guest.guid);;

    const list = this.tourDate.lists.find(l => l.id === guest.listId);
    if (list) {
      // this.dataService.selectedList = list;
    }

    LogService.log('open guest', this.selectedGuest);
    LogService.log('all purchaser guests', this.allGuests);
    this.selectedGuests = [];
    this.results = [];
  }

  public checkInText() {
    let text = 'Check-in Guest';
    if (this.selectedGuests.length > 1) {
      text = 'Check-in ' + this.selectedGuests.length + ' Guests';
    }
    return text;
  }

  public checkOutText() {
    let text = 'Check-out Guest';
    if (this.selectedGuests.length > 1) {
      text = 'Check-out ' + this.selectedGuests.length + ' Guests';
    }
    return text;
  }

  public isActiveCheckin() {
    let show = true;
    if (this.allGuests.length === 1) {
      return !this.selectedGuest['isCheckedIn'];
    }
    if (this.allGuests.length > 1) {
      if (this.selectedGuests.length === 0) {
        show = false;
      }
      this.selectedGuests.forEach(s => {
        const guest = this.allGuests.find(g => g.guid === s);
        if (guest && guest.isCheckedIn) {
          show = false;
        }
      });
    }
    return show;
  }

  public isActiveCheckout() {
    let show = true;
    if (this.allGuests.length === 1) {
      return this.selectedGuest['isCheckedIn'];
    }
    if (this.allGuests.length > 1) {
      if (this.selectedGuests.length === 0) {
        show = false;
      }
      this.selectedGuests.forEach(s => {
        const guest = this.allGuests.find(g => g.guid === s);
        if (guest && !guest.isCheckedIn) {
          show = false;
        }
      });
    }
    return show;
  }

  public canShowCheckingOut() {
    return (this.selectedPurchaserGuest && (this.selectedPurchaserGuest.isRegistered || this.selectedGuests.length>0));
  }

  public canShowRegisterAll() {
    return (this.selectedPurchaserGuest && (!this.selectedPurchaserGuest.isRegistered && this.selectedGuests.length === 0));
  }

  public handleRegister(guest) {
    this.showRegister(guest);
  }

  public handleUpdate(guest) {
    this.showUpdate();
  }

  public handleSelect(guest) {
    if (this.selectedGuests.findIndex(s => s === guest.guid) === -1) {
      this.selectedGuests.push(guest.guid);
    }
  }

  handleSelectAll(all) {
    if (all) {
      const selectedGuests = [];
      this.allGuests.forEach(allGuest => {
        if (allGuest.isRegistered) {
          selectedGuests.push(allGuest.guid);
        }
      });
      this.selectedGuests = selectedGuests;
    } else {
      this.selectedGuests = [];
    }
  }

  public handleDeselect(guest) {
    this.selectedGuests = this.selectedGuests.filter(g => guest.guid !== g);
  }

  clearSearch(event) {
    this.selectedGuest = null;
    this.selectedGuests = [];
    this.searchVal = '';
    this.checkStatus = null;
    this.inError = false;
    this.results = this.limitNonNullGuests(this.guests, 99);
  }

  handleInput(event) {
    this.selectedGuest = null;
    this.selectedGuests = [];
    this.checkStatus = null;
    this.inError = false;

    const query = event.target.value.toLowerCase();
    if (query) {
      let listFiltered = this.guests;
      // if (this.dataService.selectedList !== null) {
      //   listFiltered = listFiltered.filter(g => g.listId === this.dataService.selectedList.id);
      // }
      const filtered = this.searchService.searchInGuests(query, listFiltered);
      this.results = this.limitNonNullGuests(filtered, 99, false);
    } else {
      this.results = this.limitNonNullGuests(this.guests, 99);
    }
  }

  async mainCheckIn(guest) {
    if (this.selectedGuests.length > 0) {
      await this.checkInSelected();
    } else {
      this.checkIn(guest);
    }
  }

  async checkInSelected() {
    if (this.selectedGuests.length > 0) {
      const loading = await this.loadingCtrl.create({
        message: 'Sending',
        spinner: 'dots',
      });
      loading.present();
      console.log(this.selectedGuests);
      for (const s of this.selectedGuests) {
        const guest = this.allGuests.find(g => g.guid === s);
        if (guest && !guest.isCheckedIn) {
          console.log('checkIn start');
          const res = await this.checkService.checkIn(this.tourDate, guest.guid, guest.token, guest);
          console.log('checkIn res');
          console.log(res);
          if (res) {
            console.log('update start');
            await this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.guid, true);
            console.log('update done');
          }
        }
      }

      loading.dismiss();
      // this.selectedGuests = [];
      this.setMode('checkresult');
      this.checkStatus = 'in';
    }
  }

  public checkIn(guest: IGuest) {
    this.checkService.checkIn(this.tourDate, guest.guid, guest.token, guest).then((res) => {
      if (res)
        this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.guid, true).then(() => {
          // this.selectedGuest = null;
          this.choose(guest);
          this.setMode('checkresult');
          this.checkStatus = 'in';
          this.searchbar.value = '';
        });
    });
  }

  public checkInAfterRegister(guest: IGuest) {
    return this.checkService.checkIn(this.tourDate, guest.guid, guest.token, guest).then((res) => {
      if (res)
        this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.guid, true).then(() => {
        });
    });
  }

  public sendRegEmail(guest) {

    if (guest && guest.purchaser) {

      const purchaserId = guest.purchaser.id;

      this.dataService.querySendRegistrationEmail(purchaserId).then((data) => {
          if (data === 'ok') {
            this.selectedGuest = null;
            this.checkStatus = 'emailSent';
            this.searchbar.value = '';
          }
        },
        err => {
        },
      );
    }
  }

  async mainCheckOut(guest) {
    if (this.selectedGuests.length > 0) {
      await this.checkOutSelected();
    } else {
      this.checkOut(guest);
    }
  }

  async checkOutSelected() {
    if (this.selectedGuests.length > 0) {
      const loading = await this.loadingCtrl.create({
        message: 'Sending',
        spinner: 'dots',
      });
      loading.present();

      for (const s of this.selectedGuests) {
        const guest = this.allGuests.find(g => g.guid === s);
        if (guest && guest.isCheckedIn) {
          const res = await this.checkService.checkOut(this.tourDate, guest.guid, guest.token, guest);
          if (res) {
            await this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.guid, false);
          }
        }
      }

      loading.dismiss();
      // this.selectedGuests = [];
      this.setMode('checkresult');
      this.checkStatus = 'out';
    }
  }

  public checkOut(guest: IGuest) {
    this.checkService.checkOut(this.tourDate, guest.guid, guest.token, guest).then((res) => {
      this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.guid, false).then(() => {
        // this.selectedGuest = null;
        this.setMode('checkresult');
        this.choose(guest);
        this.checkStatus = 'out';
        this.searchbar.value = '';
      });
    });
  }

  public getRegisteredName() {
    return (this.registerGuest) ? this.registerGuest.firstName + ' ' + this.registerGuest.lastName : ''
  }

  public getNextUnregisteredGuest() {
    const unregistered = this.allGuests.find(g => g.isRegistered === false);
    return unregistered ? unregistered : false;
  }

  public getNextRegisterGuestName() {
    const next = this.getNextUnregisteredGuest();
    return (next) ? next.firstName + ' ' + next.lastName : '';
  }

  public registerNext() {
    this.setMode('register');
    this.checkStatus = null;
    const next = this.getNextUnregisteredGuest();
    if (next) {
      this.registerGuest = next;
      return next;
    } else {
      return false;
    }
  }

  public skipRegister() {
    this.setMode('lookup');
    this.choose(this.registerGuest);
    this.checkStatus = null;
  }

  public clearChecked() {
    this.setMode('lookup');
    // this.selectedGuest = null;
    this.selectedGuests = [];
    this.checkStatus = null;
  }

  get selectedGuestName() {
    if (this.selectedGuests.length ===1) {
      const guest = this.allGuests.find(g => g.guid === this.selectedGuests[0]);
      if (guest)
      return (guest) ? guest.firstName + ' ' + guest.lastName : 'Not registered';
    }
    return '';
  }

  get selectedGuestEmail() {
    if (this.selectedGuests.length ===1) {
      const guest = this.allGuests.find(g => g.guid === this.selectedGuests[0]);
      return (guest) ? guest.email : '';
    }
    return '';
  }

  get selectedGuestPhone() {
    if (this.selectedGuests.length ===1) {
      const guest = this.allGuests.find(g => g.guid === this.selectedGuests[0]);
      return (guest) ? guest.phone  : '';
    }
    return '';
  }

  get selectedGuestPurchaserName() {
    if (this.selectedGuest) {
      if (this.selectedGuest.purchaser) {
        return this.selectedGuest.purchaser.firstName + ' ' + this.selectedGuest.purchaser.lastName;
      }
      return '';
    }
    return '';
  }

  get selectedGuestPurchaserEmail() {
    if (this.selectedGuest) {
      if (this.selectedGuest.purchaser) {
        return this.selectedGuest.purchaser.email;
      }
      return '';
    }
    return '';
  }

  get selectedGuestPurchaserPhone() {
    if (this.selectedGuest) {
      if (this.selectedGuest.purchaser) {
        return this.selectedGuest.purchaser.phone;
      }
      return '';
    }
    return '';
  }

  get checkedInCount() {
    if (this.selectedGuest && this.selectedGuest.purchaserId) {
      return this.dataService.getPurchaserCounts(this.tourDates, this.tourDate, this.selectedGuest.purchaserId);
    }
    return '';
  }

  get pkgText() {
    if (this.selectedGuest) {
      if (this.selectedGuest.purchaser) {
        if (this.selectedGuest.purchaser.details) {
          const pkg = this.dataService.getPurchasePkg(this.selectedGuest.purchaser);
          return pkg;
        }
      }
      return '';
    }
    return '';
  }

  get detailsText() {
    if (this.selectedGuest) {
      if (this.selectedGuest.purchaser) {
        if (this.selectedGuest.purchaser.details) {
          const details = this.dataService.getPurchaserDetails(this.selectedGuest.purchaser);
          return details;
        }
      }
      return '';
    }
    return '';
  }

  get guestType() {
    if (this.selectedGuests.length === 1) {
      const guest = this.allGuests.find(g => g.guid === this.selectedGuests[0]);
      if (guest) {
        return (guest.isPurchaserGuest) ? 'Main Guest': 'Extra Guest'
      }
    }
    return 'Purchaser';
  }

  get notesText() {
    if (this.selectedGuests.length === 1) {
      const guest = this.allGuests.find(g => g.guid === this.selectedGuests[0]);
      return (guest) ? guest.notes : '';
    }
    else {
      if (this.selectedGuest && this.selectedGuest.purchaser) {
        return this.selectedGuest.purchaser.notes;
      }
      return '';
    }
    return '';
  }

  public closeError() {
    this.inError = false;
  }

  async searchGuest(code) {
    if (this.guests) {
      const foundGuest = this.guests.find((guest) => guest.code === code);
      if (foundGuest) {
        this.choose(foundGuest);
      } else {
        this.inError = true;
      }
    }
  }

  async scan() {
    return this.startScan();
  }

  async startScan() {
    try {
      let granted = false;

      if (Capacitor.getPlatform() === 'web') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          granted = true;
        } catch (err) {
          alert('Camera access denied in browser.');
          return;
        }
      } else {
        const status = await BarcodeScanner.checkPermission({ force: true });
        if (status.denied) {
          const c = confirm('If you want to grant permission for using your camera, enable it in the app settings.');
          if (c) {
            await BarcodeScanner.openAppSettings();
          }
          return;
        }
        granted = status.granted;
      }

      if (!granted) return;

      this.inScan = true;
      this.scanOpened.emit(true);

      BarcodeScanner.hideBackground();
      document.querySelector('body').classList.add('scanner-active');
      setTimeout(() => {
        document.querySelector('body > div > video')?.parentElement?.classList.add('scanner-height');
      }, 3000);

      const result = await BarcodeScanner.startScan();

      document.querySelector('body').classList.remove('scanner-active');
      document.querySelector('body > div')?.classList.remove('scanner-height');
      this.inScan = false;
      this.scanOpened.emit(false);

      if (result.hasContent) {
        await this.searchGuest(result.content);
      }


    } catch (e) {
      console.error(e);
    }
  }

  async stopScan() {
    console.log('stopping');
    BarcodeScanner.showBackground();
    const result = await BarcodeScanner.stopScan();
    document.querySelector('body').classList.remove('scanner-active');
    this.inScan = false;
    this.scanOpened.emit(false);
  }


  private limitNonNullGuests(guests: IGuest[], limit: number, filterByList = true): IGuest[] {
    let listFiltered = guests;
    if (this.dataService.selectedList !== null && filterByList) {
      listFiltered = guests.filter(g => g.listId === this.dataService.selectedList.id);
    }
    return listFiltered.filter(g => g.id !== null && g.isActive).slice(0, limit);
  }


  public getListInfo(guest: IGuest) {
    const list = this.tourDate.lists.find(l => l.id === guest.listId);
    return (list) ? list.title : '-not-set';
  }

  public getListColor(guest: IGuest) {
    const list = this.tourDate.lists.find(l => l.id === guest.listId);
    return this.dataService.getListColor(this.tourDate, list);
  }

  public setMode(mode) {
    console.log('set mode ',mode);
    this.mode = mode;
    this.stateChanged.emit(mode);
  }

  public callBack() {
    this.setMode('lookup');
    this.checkStatus = null;
  }
}
