import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ITourDate, ITourDates} from "../../../interfaces/tourDate";
import {IGuest, IGuests} from "../../../interfaces/guest";
import {SearchService} from "../../../services/search.service";
import {DataService} from "../../../services/data.service";
import {CheckQueService} from "../../../services/check-que.service";
import {IonSearchbar} from "@ionic/angular/directives/proxies";


@Component({
  selector: 'app-lookup-form',
  templateUrl: './lookup-form.component.html',
  styleUrls: ['./lookup-form.component.scss'],
})
export class LookupFormComponent  implements OnInit {

  @Input() tourDate: ITourDate = null;
  @Input() guests: IGuests = [];

  @ViewChild('userSearchBar') searchbar: IonSearchbar;

  protected selectedEvent = '';

  // public guests: IGuest[] = [
  //   {
  //     id: 1,
  //     guest : {
  //       name: 'Sandra Bullock',
  //       checkedIn: false,
  //     },
  //     purchaser : {
  //       name: 'Alexis Bullock'
  //     }
  //   },
  //   {
  //     id: 2,
  //     guest : {
  //       name: 'John Woo',
  //       checkedIn: true,
  //     },
  //     purchaser : {
  //       name: 'John Woo'
  //     }
  //   },
  // ];
  public results: IGuest[] = [];
  public selectedGuest: IGuest = null;

  public tourDates: ITourDates = [];

  public group: FormGroup | undefined;

  public inProgress: boolean = false;
  public checkStatus = null;

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

  public choose(guest) {
    console.log(guest);
    this.selectedGuest = guest;
    this.results = [];
  }

  handleInput(event) {
    this.selectedGuest = null;
    this.checkStatus = null;
    const query = event.target.value.toLowerCase();
    if (query) {


      const filtered = this.searchService.searchInGuests(query, this.guests);

      this.results =  filtered.slice(0,9);

//      this.results = this.guests.filter((d) => d.guest.name.toLowerCase().indexOf(query) > -1);
    }
    else {
      this.results = [];
    }
  }

  public checkIn(guest) {
    this.checkService.checkIn(this.tourDate, guest.id, guest.code).then((res)=> {
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


}
