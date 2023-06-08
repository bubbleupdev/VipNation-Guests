import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";

interface IGuest {
  id: number,
  guest: {
    name: string,
    checkedIn: boolean
  }
  purchaser: {
    name: string
  }
}

@Component({
  selector: 'app-lookup-form',
  templateUrl: './lookup-form.component.html',
  styleUrls: ['./lookup-form.component.scss'],
})
export class LookupFormComponent  implements OnInit {

  protected selectedEvent = '';

  public guests: IGuest[] = [
    {
      id: 1,
      guest : {
        name: 'Sandra Bullock',
        checkedIn: false,
      },
      purchaser : {
        name: 'Alexis Bullock'
      }
    },
    {
      id: 2,
      guest : {
        name: 'John Woo',
        checkedIn: true,
      },
      purchaser : {
        name: 'John Woo'
      }
    },
  ];
  public results: IGuest[] = [];
  public selectedGuest: IGuest = null;

  public group: FormGroup | undefined;

  public inProgress: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.group = this.formBuilder.group({
      guest: ['', [Validators.required]],
    });
  }

  public async processSubmit() {
    return;
  }

  public choose(guest) {
    this.selectedGuest = guest;
  }

  handleInput(event) {
    this.selectedGuest = null;
    const query = event.target.value.toLowerCase();
    if (query) {
      this.results = this.guests.filter((d) => d.guest.name.toLowerCase().indexOf(query) > -1);
    }
    else {
      this.results = [];
    }
  }

}
