import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IGuest} from "../../../interfaces/guest";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {DataService} from "../../../services/data.service";
import {LoadingController} from "@ionic/angular";
import {markAllFormControlsAsTouched} from "../../../helpers/data.helper";
import {submitFormMutation} from "../../../../graphql/mutations";
import {GraphqlService} from "../../../services/graphql.service";
import {FormSubmitService} from "../../../services/form-submit.service";
import {SafeGraphqlService} from "../../../services/safe-graphql.service";
import {CheckQueService} from "../../../services/check-que.service";
import {RegisterService} from "../../../services/register.service";
import {ITourDate} from "../../../interfaces/tourDate";

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.scss'],
})
export class RegistrationFormComponent implements OnInit {

  @Input() guest: IGuest = null;
  @Input() tourDate: ITourDate = null;
  @Output() closed: EventEmitter<any> = new EventEmitter<any>();

  public group: FormGroup | undefined;
  public inProgress: boolean = false;

  public extraGuestsCount: number = 0;
  public waiverRequired: boolean = false;
  public waiverText: string = '';

  constructor(
    public formBuilder: FormBuilder,
    public router: Router,
    public dataService: DataService,
    private loadingCtrl: LoadingController,
    private graphqlService: SafeGraphqlService,
    private formSubmitService: FormSubmitService,
    public checkService: CheckQueService
  ) {
  }

  ngOnInit() {

    if (this.guest) {
      const purchaser = this.guest.purchaser;
      if (this.guest.isPurchaserGuest) {
        let purchaserGuests = [];
        if (this.tourDate) {
          purchaserGuests = this.tourDate.guests.filter(guest => !guest.isPurchaserGuest && guest.purchaserId === purchaser.id);
        }
        const extraGuestsCount = purchaser.extraGuests - purchaserGuests.length;
        this.extraGuestsCount = (extraGuestsCount < 0) ? 0 : extraGuestsCount;
      }
      this.waiverRequired = purchaser.waiverRequired;
      this.waiverText = purchaser.waiverText;
    }


    this.group = this.formBuilder.group({
      first_name: [this.guest.firstName, [Validators.required]],
      last_name: [this.guest.lastName, [Validators.required]],
      email: [this.guest.email, [Validators.required, Validators.email]],
      phone: [this.guest.phone, [Validators.required]],
      mailing_subscribe: [null]
    });

    // @ts-ignore
    this.group.controls.first_name['error_messages'] = {
      'required': 'First Name is required.'
    };
    // @ts-ignore
    this.group.controls.last_name['error_messages'] = {
      'required': 'Last Name is required.'
    };

    // @ts-ignore
    this.group.controls.email['error_messages'] =
      {
        'required': 'Email is required.',
        'email': 'Email is not valid.'
      }
    ;
    // @ts-ignore
    this.group.controls.phone['error_messages'] = {
      'required': 'Phone is required.'
    };


    if (this.waiverRequired) {
      this.group.addControl('agree', new FormControl(null, Validators.required));

      // @ts-ignore
      this.group.controls.agree['error_messages'] = {
        'required': 'Agreement is required.'
      };

    } else {
      this.group.addControl('agree', new FormControl(null));
    }

    if (this.extraGuestsCount > 0) {

      const extraArray = [];

      for (let i = 1; i <= this.extraGuestsCount; i++) {
        const extraArrayGroup = this.formBuilder.group({
          [`first_name-${i}`]: ['', [Validators.required]],
          [`last_name-${i}`]: ['', [Validators.required]],
          [`email-${i}`]: ['', [Validators.required, Validators.email]],
          [`phone-${i}`]: ['', [Validators.required]],
          [`phone-${i}`]: [],
        });
        extraArray.push(extraArrayGroup);

        extraArrayGroup.controls["first_name-" + i]['error_messages'] = {
          'required': 'First Name is required.'
        };
        extraArrayGroup.controls["last_name-" + i]['error_messages'] = {
          'required': 'Last Name is required.'
        };

        extraArrayGroup.controls["email-" + i]['error_messages'] =
          {
            'required': 'Email is required.',
            'email': 'Email is not valid.',
          };
        extraArrayGroup.controls["phone-" + i]['error_messages'] = {
          'required': 'Phone is required.'
        };

      }

      this.group.addControl('extraGuests', new FormArray(extraArray));
    }

  }

  get extraGuests() {
    return this.group.get('extraGuests') as FormArray;
  }

  public getControl(extraGroup, name) {
    return extraGroup.get(name) as FormControl;

  }

  public close() {
    this.closed.emit({'status': 'skip'});
  }

  protected makePlainExtra(extraArray) {
    let extra = {};

    extraArray.forEach(item => {
      extra = {...extra, ...item}
    });

    return extra;
  }

  protected isExtraEmailsIsUnique() {
    const emails = [];

    emails.push(this.group.get('email').value);

    for (let i = 1; i <= this.extraGuestsCount; i++) {
      const emailField = this.group.get("extraGuests."+(i-1)+".email-" + i);
      const email = emailField.value;
      if (emails.includes(email)) {
        emailField.setErrors({
          message: "Email is not unique"
        });
        return false;
      }
      else {
        emails.push(email);
      }
    }
    return true;
  }

  async processSubmit() {

    if (this.waiverRequired) {
      let fname = this.group.get('first_name').value;
      const agree = this.group.get('agree').value;
      if ((agree).trim() == "" || agree === null) {
        this.group.get('agree').setErrors({
          message: "Type Your First Name To Agree"
        });
        markAllFormControlsAsTouched(this.group, false);
        return false;
      }
      else {
        fname = (fname) ? fname.trim() : '';
        if (fname.toLowerCase() !== (agree.trim()).toLowerCase()) {
          this.group.get('agree').setErrors({
            message: "Type Your First Name To Agree"
          });
          markAllFormControlsAsTouched(this.group, false);
          return false;
        }
      }
    }

    if (!this.isExtraEmailsIsUnique()) {
      markAllFormControlsAsTouched(this.group, false);
      return false;
    }


    markAllFormControlsAsTouched(this.group);

    const data = this.group.getRawValue();
    data['code'] = this.guest.token;

    if (this.extraGuestsCount > 0) {
      data['extraGuestsObjects'] = data['extraGuests'];
      data['extraGuests'] = this.makePlainExtra(data['extraGuests']);
    }
    else {
      data['extraGuestsObjects'] = [];
    }

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

      this.checkService.register(this.guest, data)
        .then((response) => {

          if (response['result'] === 'ok') {

            const result = response.response.data['submitForm'];
            if (result.errors !== null && result.errors.length > 0) {
              const preparedErrors = this.formSubmitService.prepareFormErrors(result.errors);
              this.formSubmitService.setFormErrors(this.group, preparedErrors);
//           if (this.extraGuestsCount>0) {
//             this.setFormErrorsExtra(result.errors);
//           }
            } else {
              console.log(result);
              this.closed.emit(response);
            }
          }
          else {
            console.log(response);
            this.closed.emit(response);
          }
        },
        err => {
          console.log(err);
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

//    this.registerSuccess.emit();
  }

  public displayError() {
    this.group.controls['captcha'].setErrors({'message': 'Registration error '});
  }

  protected capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  public agreeChange(ev) {
    if (ev && ev.target) {
      this.group.controls['agree'].setValue(this.capitalizeFirstLetter(ev.target.value));
    }
  }
}
