import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {ITourDate, ITourDates} from "../../../interfaces/tourDate";
import {SearchService} from "../../../services/search.service";
import {DataService} from "../../../services/data.service";

@Component({
  selector: 'app-select-event-form',
  templateUrl: './select-event-form.component.html',
  styleUrls: ['./select-event-form.component.scss'],
})
export class SelectEventFormComponent  implements OnInit {

  @Input() events: ITourDates = [];

  // [
  //   'Alicia Keys-The Woodlands,TX 05/30/2023',
  //   'Alicia Keys-Anchorage,AK 06/08/2023',
  // ];

  public results = [];
  public selectedEvent: ITourDate = null;

  public group: FormGroup | undefined;

  public inProgress: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    public router: Router,
    public dataService: DataService,
    public searchService: SearchService
  ) { }

  ngOnInit() {
    this.group = this.formBuilder.group({
      event: ['', [Validators.required]],
    });

  }

  handleInput(event) {
    this.selectedEvent = null;
    const query = event.target.value.toLowerCase();
    if (query) {

      const filtered = this.searchService.searchInEvents(query, this.events);

      this.results =  filtered.slice(0,9); //this.events.filter((d) => d.name.toLowerCase().indexOf(query) > -1);
    }
    else {
      this.results = [];
    }
  }

  public choose(event) {
    this.selectedEvent = event;
  }

  public goCheckIn() {
    this.dataService.selectEvent(this.selectedEvent);
//    this.router.navigate(['home'], {replaceUrl: true});
  }

  public reset(event) {
    this.results = [];
    this.selectedEvent = null;
  }

  public async processSubmit() {
    return;
  }

}
