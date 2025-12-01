import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ITourDate, ITourDates} from "../../../interfaces/tourDate";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {DataService} from "../../../services/data.service";
import {SearchService} from "../../../services/search.service";
import {LoadingController} from "@ionic/angular";
import {markAllFormControlsAsTouched} from "../../../helpers/data.helper";
import {IGuestLists} from "../../../interfaces/guest-list";

@Component({
  selector: 'app-send-sms-form',
  templateUrl: './send-sms-form.component.html',
  styleUrls: ['./send-sms-form.component.scss'],
})
export class SendSmsFormComponent implements OnInit {

  @Input() event: ITourDate = null;

  protected currentEvent: ITourDate = null;
  public listId: number = null;

  public lists: IGuestLists = [];
  public smsMaxLength: number = 160;
  public messageLength: number = 0;

  public messageSent: boolean = false;

  @Output() sendSuccess: EventEmitter<Event> = new EventEmitter<Event>();

  public message: string = '';

  // [
  //   'Alicia Keys-The Woodlands,TX 05/30/2023',
  //   'Alicia Keys-Anchorage,AK 06/08/2023',
  // ];

  public results = [];
  public selectedEvent: ITourDate = null;

  public group: FormGroup | undefined;

  public inProgress: boolean = false;

  public selectOptions: Array<{
    value: string;
    label: string
  }> = [];

  constructor(
    public formBuilder: FormBuilder,
    public router: Router,
    public dataService: DataService,
    private loadingCtrl: LoadingController,
  ) { }


  private countCharacters(value: string): number {
    if (!value) {
      return 0;
    }

    let count = 0;

    for (const ch of value) {
      const code = ch.codePointAt(0);
      if (code !== undefined && code <= 0x7F) {
        count += 1;
      } else {
        count += 2;
      }
    }

    return count;
  }

  public onMessageInput(ev): void {
    const newValue: string = ev?.target?.value || '';

    if (this.group) {
      this.group.controls['message'].setValue(newValue, { emitEvent: false });
    }

    const length = this.countCharacters(newValue);
    this.messageLength = length;

    if (length > this.smsMaxLength) {
      const truncated = Array.from(newValue)
        .slice(0, this.smsMaxLength)
        .join('');

      if (this.group) {
        this.group.controls['message'].setValue(truncated, { emitEvent: false });
      }

      this.messageLength = this.smsMaxLength;
    }
  }

  ngOnInit() {

    this.group = this.formBuilder.group({
      message: ['', [Validators.required]],
      checkedIn: [''],
      selectedList: [null]
    });

    // @ts-ignore
    this.group.controls.message['error_messages'] = {
      'required': 'Message is required.'
    };

    if (this.event) {
      this.currentEvent = this.event;
      if (this.currentEvent.lists) {
        this.lists = this.currentEvent.lists;

        const selectOptions = [];
        this.lists.forEach((list) => {
           const selectOption = {
             value: list.id,
             label: list.title
           }
           selectOptions.push(selectOption);
        });

        this.selectOptions = selectOptions;
      }
    }
  }


  get isEmptyMessage() {
    return !(!!this.group.controls['message'].value);
  }

  public reset() {
    this.messageSent = false;
    this.group.controls['message'].setValue('');
    this.messageLength = 0;
  }

  public select() {
    this.router.navigate(['select-event']);
  }

  public async processSubmit() {
    const loading = await this.loadingCtrl.create({
      message: 'Sending',
      spinner: 'dots',
    });

    if (this.group.invalid) {

      return markAllFormControlsAsTouched(this.group);
    }

    if (!this.group.valid) {
      return false;
    } else {

      this.disableSubmitButton();
      loading.present();

      const checkedInValue = this.group.controls['checkedIn'].value === '' ? null : this.group.controls['checkedIn'].value;

      this.dataService.querySendSms('event', this.group.controls['message'].value,
                                    this.event.instanceId,
                                    JSON.stringify(this.group.controls['selectedList'].value),
                                      checkedInValue).then((data) => {
          if (data === 'ok') {
            this.messageSent = true;

            // this.userService.initCurrentUser().subscribe(user => {
            //
            //     this.enableSubmitButton();
            //     loading.dismiss();
            //     this.processSuccess();
            //
            //     // if (roles.includes('RegisteredMember')) {
            //     // } else {
            //     //   this.router.navigate(['/logout']);
            //     // }
            //   },
            //   (error) => {
            //     this.enableSubmitButton();
            //     loading.dismiss();
            //   });
          }
        },
        err => {
          this.displayError();
        },
      )
        .finally(() => {
          this.enableSubmitButton();
          loading.dismiss();
        });

    }
  }

  protected disableSubmitButton() {
    this.inProgress = true;
  }

  protected enableSubmitButton() {
    this.inProgress = false;
  }

  protected processSuccess() {

    this.group.reset('');
    this.messageLength = 0;

    this.sendSuccess.emit();
  }

  public displayError() {
    this.group.controls['message'].setErrors({'message': 'Error send sms'});
  }

  public goCheckIn() {
    this.router.navigate(['home'],{replaceUrl: true});
  }

}
