import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IGuest} from "../../../interfaces/guest";

@Component({
  selector: 'app-guest-list',
  templateUrl: './guest-list.component.html',
  styleUrls: ['./guest-list.component.scss'],
})
export class GuestListComponent  implements OnInit {

  @Input() guestList: IGuest[] = [];
  @Input() selectedGuest: IGuest = null;
  @Input() purchaserGuest: IGuest = null;

  @Input() selectedGuests: IGuest[] = [];

  @Output() selectGuest: EventEmitter<IGuest> = new EventEmitter<IGuest>();
  @Output() deselectGuest: EventEmitter<IGuest> = new EventEmitter<IGuest>();
  @Output() registerGuest: EventEmitter<IGuest> = new EventEmitter<IGuest>();

  @Output() selectAll: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {}


  public isSelected(guest) {
    console.log('is selected');
    console.log(guest);
    return this.selectedGuests.find((g) => g.id === guest.id);
  }

  public changeAll(ev) {
    this.selectAll.emit(ev.detail.checked);
  }


  public change(ev, guest) {
    if (ev.detail.checked) {
      this.selectGuest.emit(guest);
    }
    else {
      this.deselectGuest.emit(guest);
    }
  }

  public manyGuests() {
    return this.guestList.length > 1;
  }

  public getStatus(guest) {
    let str = '';
    if (!guest.isRegistered) {
      str += ' (Not Registered)';
    }
    return str;
  }


  public getName(guest) {
    let str =  (guest) ? guest.firstName + ' ' + guest.lastName : '';
    return str;
  }

  public getColor(guest) {
    if (this.selectedGuest && guest) {
      if (guest.id === this.selectedGuest.id) {
        return ''; //'success';
      }
    }
    return ''
  }

  public register(guest) {
    this.registerGuest.emit(guest);
  }

}
