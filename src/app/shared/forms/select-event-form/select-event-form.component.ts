import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";

@Component({
  selector: 'app-select-event-form',
  templateUrl: './select-event-form.component.html',
  styleUrls: ['./select-event-form.component.scss'],
})
export class SelectEventFormComponent  implements OnInit {

  public events = [
    'Alicia Keys-The Woodlands,TX 05/30/2023',
    'Alicia Keys-Anchorage,AK 06/08/2023',
  ];
  public results = [];
  public selectedEvent = '';

  public group: FormGroup | undefined;

  public inProgress: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    public router: Router
  ) { }

  ngOnInit() {
    this.group = this.formBuilder.group({
      event: ['', [Validators.required]],
    });
  }

  handleInput(event) {
    this.selectedEvent = '';
    const query = event.target.value.toLowerCase();
    if (query) {
      this.results = this.events.filter((d) => d.toLowerCase().indexOf(query) > -1);
    }
    else {
      this.results = [];
    }
  }

  public choose(event) {
    this.selectedEvent = event;
  }

  public goCheckIn() {
    this.router.navigate(['home']);
  }

  public async processSubmit() {
    return;
  }

}
