import {Component, Input, OnInit} from '@angular/core';
import {IGuestLists} from "../../../interfaces/guest-list";
import {listColors} from "../../../helpers/data.helper";
import {LogService} from "../../../services/log.service";
import {ITourDate} from "../../../interfaces/tourDate";
import {DataService} from "../../../services/data.service";

@Component({
  selector: 'app-event-guest-lists',
  templateUrl: './event-guest-lists.component.html',
  styleUrls: ['./event-guest-lists.component.scss'],
})
export class EventGuestListsComponent  implements OnInit {

  @Input() selectedEvent: ITourDate;
  @Input() guestLists: IGuestLists = [];

  constructor(
    private dataService: DataService
  ) { }

  ngOnInit() {
    console.log('Guest Lists');
    console.log(this.guestLists);
  }

  public getColor(listIndex, list) {
    let color = null;
    if (list && list.colorCode) {
      return "#" + list.colorCode;
    }
    const item = listColors.find(lc => lc.catId == listIndex);
    if (item) {
      color = item.color;
    }
    return color;
  }

  public getListStat(list) {
    const notChecked = list.max - list.checkedIn;
    const line = `${list.max} total guests | ${list.checkedIn} checked-in | ${notChecked} not checked-in`;
    return line;
  }


  public goCheckIn(list) {
    LogService.log('Selected event', this.selectedEvent);
    this.dataService.selectEvent(this.selectedEvent, list);
//    this.router.navigate(['home'], {replaceUrl: true});
  }

}
