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

  public allChecked: boolean = false;

  constructor() { }

  ngOnInit() {


  }

  public isAllSelected() {
    let isAll = this.guestList.length === this.selectedGuests.length && this.selectedGuests.length !== 0;
    return isAll;
  }

  public isSelected(guest) {
    return this.selectedGuests.find((g) => g.id === guest.id);
  }

  public changeAll(ev, checked) {
    console.log(ev);
    // this.selectAll.emit(ev.detail.checked);
    this.selectAll.emit(!checked);
//    this.allChecked = !checked;
  }


  public change(ev, guest) {
    console.log('change');
    if (ev.detail.checked) {
      this.selectGuest.emit(guest);
    }
    else {
      this.deselectGuest.emit(guest);
    }
    setTimeout( () => {
      this.allChecked = this.isAllSelected();
    },10);
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
