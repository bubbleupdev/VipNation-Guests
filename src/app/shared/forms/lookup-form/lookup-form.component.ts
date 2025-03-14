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
import {Subscription} from "rxjs";
import {RegistrationFormComponent} from "../registration-form/registration-form.component";
import {IPurchaser} from "../../../interfaces/purchaser";
import {LoadingController} from "@ionic/angular";
import {RegisterService} from "../../../services/register.service";
import {FormSubmitService} from "../../../services/form-submit.service";
import {LogService} from "../../../services/log.service";
import {environment} from "../../../../environments/environment";
import {Browser} from "@capacitor/browser";


@Component({
  selector: 'app-lookup-form',
  templateUrl: './lookup-form.component.html',
  styleUrls: ['./lookup-form.component.scss'],
})
export class LookupFormComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  @Input() tourDate: ITourDate = null;
  @Input() guests: IGuests = [];

  @Output() scanOpened: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('userSearchBar') searchbar: IonSearchbar;

  @ViewChild('registrationForm') registrationForm: RegistrationFormComponent;

  // "lookup" | "register" | "checkresult"
  public mode: "lookup" | "register" | "checkresult" = 'lookup';
  public registerGuest: IGuest = null;

  protected selectedEvent = '';

  public results: IGuest[] = [];
  public selectedGuest: IGuest = null;

  public allGuests: IGuest[] = [];
  public selectedPurchaserGuest: IGuest = null;
//  public selectedGuests: IGuest[] = [];
  public selectedGuests: number[] = [];

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
    // this.mode = 'checkresult';
    // this.checkStatus = 'registered';

  }

  public testAction() {
    this.initTest();
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
        this.allGuests = this.getGuests(this.selectedGuest);
        this.selectedPurchaserGuest = this.allGuests.find(guest => guest.isPurchaserGuest);
      }
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
        if (this.registerGuest.isPurchaserGuest) {
          const registerData = ev['registerData'];
          if (registerData && registerData['extraGuestsObjects']) {
            const extraGuestsObjects = registerData['extraGuestsObjects'];
            const wasChanges = this.registerService.createFakeGuests(extraGuestsObjects, this.registerGuest, this.tourDate);
            if (wasChanges) {
              this.dataService.reCalcEventCounts(this.tourDate);
              await this.dataService.saveTourDatesToStorage(this.tourDates);
            }

          }
        }
      }

      const sfUrl = environment.salesForceUrl;
      if (ev && ev['registerData']) {
        if (ev['registerData']['mailing_subscribe']) {
          Browser.open({url: sfUrl});
        }
      }

      this.registerService.updateGuestIsRegisteredStatus(this.tourDates, this.tourDate, this.registerGuest.id).then(() => {
        this.checkInAfterRegister(this.registerGuest).then(() => {
        });
      }).finally(() => {
        this.checkStatus = 'registered';
        this.mode = 'checkresult';
        this.choose(this.registerGuest);
      });

    } else if (ev['status'] === 'skip') {
      this.mode = 'lookup';
      this.checkStatus = '';
    }
  }

  public showRegister(guest) {
    this.mode = 'register';
    console.log(guest);
    this.registerGuest = guest;
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
    this.selectedGuest = guest;
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
        const guest = this.allGuests.find(g => g.id === s);
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
        const guest = this.allGuests.find(g => g.id === s);
        if (guest && !guest.isCheckedIn) {
          show = false;
        }
      });
    }
    return show;
  }

  public showCheckingOut() {
    return (this.selectedPurchaserGuest.isRegistered);
  }

  public handleRegister(guest) {
    this.showRegister(guest);
  }

  public handleSelect(guest) {
    if (this.selectedGuests.findIndex(s => s === guest.id) === -1) {
      this.selectedGuests.push(guest.id);
    }
  }

  handleSelectAll(all) {
    if (all) {
      const selectedGuests = [];
      this.allGuests.forEach(allGuest => {
        if (allGuest.isRegistered) {
          selectedGuests.push(allGuest.id);
        }
      });
      this.selectedGuests = selectedGuests;
    } else {
      this.selectedGuests = [];
    }
  }

  public handleDeselect(guest) {
    this.selectedGuests = this.selectedGuests.filter(g => guest.id !== g);
  }

  clearSearch(event) {
    this.selectedGuest = null;
    this.selectedGuests = [];
    this.searchVal = '';
    this.checkStatus = null;
    this.inError = false;
  }

  handleInput(event) {
    this.selectedGuest = null;
    this.selectedGuests = [];
    this.checkStatus = null;
    this.inError = false;

    const query = event.target.value.toLowerCase();
    if (query) {
      const filtered = this.searchService.searchInGuests(query, this.guests);
      this.results = filtered.slice(0, 99);
    } else {
      this.results = [];
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
        const guest = this.allGuests.find(g => g.id === s);
        if (guest && !guest.isCheckedIn) {
          console.log('checkIn start');
          const res = await this.checkService.checkIn(this.tourDate, guest.id, guest.token, guest);
          console.log('checkIn res');
          console.log(res);
          if (res) {
            console.log('update start');
            await this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.id, true);
            console.log('update done');
          }
        }
      }

      loading.dismiss();
      // this.selectedGuests = [];
      this.mode = 'checkresult';
      this.checkStatus = 'in';
    }
  }

  public checkIn(guest) {
    this.checkService.checkIn(this.tourDate, guest.id, guest.token, guest).then((res) => {
      if (res)
        this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.id, true).then(() => {
          // this.selectedGuest = null;
          this.mode = 'checkresult';
          this.checkStatus = 'in';
          this.searchbar.value = '';
        });
    });
  }

  public checkInAfterRegister(guest) {
    return this.checkService.checkIn(this.tourDate, guest.id, guest.token, guest).then((res) => {
      if (res)
        this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.id, true).then(() => {
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
        const guest = this.allGuests.find(g => g.id === s);
        if (guest && guest.isCheckedIn) {
          const res = await this.checkService.checkOut(this.tourDate, guest.id, guest.token, guest);
          if (res) {
            await this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.id, false);
          }
        }
      }

      loading.dismiss();
      // this.selectedGuests = [];
      this.mode = 'checkresult';
      this.checkStatus = 'out';
    }
  }

  public checkOut(guest) {
    this.checkService.checkOut(this.tourDate, guest.id, guest.token, guest).then((res) => {
      this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.id, false).then(() => {
        // this.selectedGuest = null;
        this.mode = 'checkresult';
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
    this.mode = 'register';
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
    this.mode = 'lookup';
    this.choose(this.registerGuest);
    this.checkStatus = null;
  }

  public clearChecked() {
    this.mode = 'lookup';
    // this.selectedGuest = null;
    this.selectedGuests = [];
    this.checkStatus = null;
  }

  get selectedGuestName() {
    if (this.selectedGuest) {
      return (this.selectedGuest.isRegistered) ? this.selectedGuest.firstName + ' ' + this.selectedGuest.lastName : 'Not registered';
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

  get notesText() {
    if (this.selectedGuest) {
      if (this.selectedGuest.purchaser) {
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
    // Check camera permission

    const status = await BarcodeScanner.checkPermission();

    if (status.denied) {
      // the user denied permission for good
      // redirect user to app settings if they want to grant it anyway
      const c = confirm('If you want to grant permission for using your camera, enable it in the app settings.');
      if (c) {
        BarcodeScanner.openAppSettings();
      }
    }

    // This is just a simple example, check out the better checks below
    try {
      BarcodeScanner.checkPermission({force: true}).then(async (res: CheckPermissionResult) => {
        if (res.granted) {
          this.inScan = true;

          this.scanOpened.emit(true);
          // make background of WebView transparent
          // note: if you are using ionic this might not be enough, check below
          BarcodeScanner.hideBackground();

          document.querySelector('body').classList.add('scanner-active');

          const result = await BarcodeScanner.startScan(); // start scanning and wait for a result

          // if the result has content
          if (result.hasContent) {
            document.querySelector('body').classList.remove('scanner-active');
            this.inScan = false;
            this.scanOpened.emit(false);
            await this.searchGuest(result.content);
          } else {
            document.querySelector('body').classList.remove('scanner-active');
            this.inScan = false;
            this.scanOpened.emit(false);
          }
        }
        else {

        }
      });


    } catch (e) {
    }

  };

  async stopScan() {
    console.log('stopping');
    BarcodeScanner.showBackground();
    const result = await BarcodeScanner.stopScan();
    document.querySelector('body').classList.remove('scanner-active');
    this.inScan = false;
    this.scanOpened.emit(false);
  }

}
