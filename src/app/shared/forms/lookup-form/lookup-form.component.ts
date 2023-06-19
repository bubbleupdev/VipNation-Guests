import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ITourDate, ITourDates} from "../../../interfaces/tourDate";
import {IGuest, IGuests} from "../../../interfaces/guest";
import {SearchService} from "../../../services/search.service";
import {DataService} from "../../../services/data.service";
import {CheckQueService} from "../../../services/check-que.service";
import {IonSearchbar} from "@ionic/angular/directives/proxies";
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';


@Component({
  selector: 'app-lookup-form',
  templateUrl: './lookup-form.component.html',
  styleUrls: ['./lookup-form.component.scss'],
})
export class LookupFormComponent  implements OnInit {

  @Input() tourDate: ITourDate = null;
  @Input() guests: IGuests = [];

  @Output() scanOpened: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('userSearchBar') searchbar: IonSearchbar;

  protected selectedEvent = '';

  public results: IGuest[] = [];
  public selectedGuest: IGuest = null;

  public searchVal: string = '';

  public tourDates: ITourDates = [];

  public group: FormGroup | undefined;

  public inProgress: boolean = false;
  public checkStatus = null;

  public inScan: boolean = false;
  public inError: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    public searchService: SearchService,
    public dataService: DataService,
    public checkService: CheckQueService
  ) { }

  ngOnInit() {
    this.group = this.formBuilder.group({
      guest: ['', [Validators.required]],
    });

    this.dataService.tourDates$.subscribe((tourDates) => {
      this.tourDates = tourDates;
    });
  }

  public async processSubmit() {
    return;
  }

  public choose(guest: IGuest) {
    if (guest) {
      const val = guest.firstName + ' ' + guest.lastName + ' ' + guest.email;
      if (this.searchbar) {
        this.searchbar.value = val;
      }
      this.searchVal = val;
    }
    this.selectedGuest = guest;
    this.results = [];
  }

  handleInput(event) {
    this.selectedGuest = null;
    this.checkStatus = null;
    this.inError = false;

    const query = event.target.value.toLowerCase();
    if (query) {
      const filtered = this.searchService.searchInGuests(query, this.guests);
      this.results =  filtered.slice(0,9);
      console.log(this.results);

//      this.results = this.guests.filter((d) => d.guest.name.toLowerCase().indexOf(query) > -1);
    }
    else {
      this.results = [];
    }
  }

  public checkIn(guest) {
    this.checkService.checkIn(this.tourDate, guest.id, guest.code).then((res)=> {
      if (res)
      this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.id, true).then(() => {
        this.selectedGuest = null;
        this.checkStatus = 'in';
        this.searchbar.value = '';
      });
    });
  }

  public checkOut(guest) {
    this.checkService.checkOut(this.tourDate, guest.id, guest.code).then((res)=> {
      this.dataService.updateGuestCheckInStatus(this.tourDates, this.tourDate, guest.id, false).then(() => {
        this.selectedGuest = null;
        this.checkStatus = 'out';
        this.searchbar.value = '';
      });
    });
  }

  public clearChecked() {
    this.checkStatus = null;
  }

  get selectedGuestName() {
    if (this.selectedGuest) {
      return this.selectedGuest.firstName + ' ' + this.selectedGuest.lastName;
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

  get detailsText() {
    if (this.selectedGuest) {
      if (this.selectedGuest.purchaser) {
        const detailsTxt = [];
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
        console.log(foundGuest);
        this.choose(foundGuest);
      }
      else {
        this.inError = true;
      }
    }
  }

  async scan() {
    this.inScan = true;
    return this.startScan();
  }

  async startScan() {
    // Check camera permission
    // This is just a simple example, check out the better checks below
    await BarcodeScanner.checkPermission({ force: true });

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
    }
    else {
      document.querySelector('body').classList.remove('scanner-active');
      this.inScan = false;
      this.scanOpened.emit(false);
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
