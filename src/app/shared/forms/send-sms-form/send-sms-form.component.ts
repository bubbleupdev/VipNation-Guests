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

  ngOnInit() {
    this.group = this.formBuilder.group({
      message: ['', [Validators.required]],
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

      this.dataService.querySendSms('event', this.group.controls['message'].value,
                                    this.event.instanceId, this.group.controls['selectedList'].value).then((data) => {
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

    this.sendSuccess.emit();
  }

  public displayError() {
    this.group.controls['message'].setErrors({'message': 'Error send sms'});
  }

  public goCheckIn() {
    this.router.navigate(['home'],{replaceUrl: true});
  }

}
