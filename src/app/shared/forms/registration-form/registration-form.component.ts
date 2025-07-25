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
  @Input() onlyUpdate: boolean = false;
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

      if (!this.onlyUpdate) {
        this.waiverRequired = purchaser.waiverRequired;
        this.waiverText = purchaser.waiverText;
      }
      else {
        this.waiverRequired = false;
      }

      if (this.guest.isPurchaserGuest && !this.onlyUpdate) {
        let purchaserGuests = [];
        if (this.tourDate) {
          purchaserGuests = this.tourDate.guests.filter(guest => !guest.isPurchaserGuest && guest.purchaserId === purchaser.id && guest.isRegistered !== true);

          console.log('Purchaser guests');
          console.log(purchaserGuests);
        }
        this.extraGuestsCount = purchaserGuests.length;

        const extraArray = [];

        for (let i = 0; i < this.extraGuestsCount; i++) {
          const guestData = purchaserGuests[i];
          const extraArrayGroup: FormGroup = this.formBuilder.group({
            first_name: [guestData.firstName || '', [Validators.required]],
            last_name: [guestData.lastName || '', [Validators.required]],
            email: [guestData.email || ''],
            phone: [guestData.phone || ''],
            guid: [guestData.guid || '', [Validators.required]],
            sameAsMainGuest: [guestData.sameAsMain],
            notes: [guestData.notes || ''],
            num: [(i+1)],
            is_active: [guestData.isActive],
            // ...(this.waiverRequired ? { [`agree`]: ['', Validators.required] } : {})
          });

          extraArrayGroup.controls["first_name"]['error_messages'] = {
            'required': 'First Name is required.'
          };
          extraArrayGroup.controls["last_name"]['error_messages'] = {
            'required': 'Last Name is required.'
          };

          extraArrayGroup.controls["email"]['error_messages'] =
            {
              'required': 'Email is required.',
              'email': 'Email is not valid.',
            };
          extraArrayGroup.controls["phone"]['error_messages'] = {
            'required': 'Phone is required.'
          };

          if (this.waiverRequired) {
            extraArrayGroup.addControl('agree', new FormControl(null, Validators.required));

            // @ts-ignore
            extraArrayGroup.controls['agree']['error_messages'] = {
              'required': 'Agreement is required.'
            };

          } else {
            extraArrayGroup.addControl('agree', new FormControl(null));
          }
          extraArray.push(extraArrayGroup);


        }

        this.group = this.formBuilder.group({
          first_name: [this.guest.firstName, [Validators.required]],
          last_name: [this.guest.lastName, [Validators.required]],
          email: [this.guest.email, [Validators.required, Validators.email]],
          phone: [this.guest.phone, [Validators.required]],
          notes: [this.guest.notes, []],
          mailing_subscribe: [null],
          extraGuests: new FormArray(extraArray)
        });
      } else {
        if (this.guest.isPurchaserGuest) {
          this.group = this.formBuilder.group({
            first_name: [this.guest.firstName, [Validators.required]],
            last_name: [this.guest.lastName, [Validators.required]],
            email: [this.guest.email, [Validators.required, Validators.email]],
            phone: [this.guest.phone, [Validators.required]],
            notes: [this.guest.notes, []],
            mailing_subscribe: [null]
          });
        }
        else {
          this.group = this.formBuilder.group({
            first_name: [this.guest.firstName, [Validators.required]],
            last_name: [this.guest.lastName, [Validators.required]],
            email: [this.guest.email],
            phone: [this.guest.phone],
            notes: [this.guest.notes, []],
            mailing_subscribe: [null]
          });
        }
        // Add sameAsMainGuest control and logic for single guest
        this.group.addControl('sameAsMainGuest', new FormControl(false));
        this.group.get('sameAsMainGuest').valueChanges.subscribe(() => {
          this.toggleSameAsMainForSingle();
        });
      }



    } else {
      // this.group = this.formBuilder.group({
      //   first_name: ['', [Validators.required]],
      //   last_name: ['', [Validators.required]],
      //   email: ['', [Validators.required, Validators.email]],
      //   phone: ['', [Validators.required]],
      //   mailing_subscribe: [null]
      // });
    }

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

    if (this.extraGuestsCount > 0 && this.group.get('extraGuests')) {
      const extraGuestsArray = this.group.get('extraGuests') as FormArray;
      if (extraGuestsArray) {
        extraGuestsArray.controls.forEach((extraGroup: FormGroup, index: number) => {
          // extraGroup.get('sameAsMainGuest').valueChanges.subscribe((checked) => {
          extraGroup.get('sameAsMainGuest').valueChanges.subscribe((checked) => {
            this.toggleSameAsMain(extraGroup, index);
          });
        });
      }
    }

  }

  get extraGuests() {
    return this.group.get('extraGuests') as FormArray;
  }

  public getControl(extraGroup, name) {
    return extraGroup.get(name) as FormControl;
  }

  public getControlNumValue(extraGroup) {
    const name = 'num';
    const control = extraGroup.get(name) as FormControl;
    if (control) {
      return control.value;
    }
    else {
      return null;
    }
  }

  public getControlIsActiveValue(extraGroup) {
    const name = 'is_active';
    const control = extraGroup.get(name) as FormControl;
    if (control) {
      return control.value;
    }
    else {
      return null;
    }
  }

  public close() {
    this.closed.emit({'status': 'skip'});
  }

  protected makePlainExtra(extraArray) {
    const result = {};
    extraArray.forEach((item, index) => {
      const num = index + 1;
      Object.entries(item).forEach(([key, value]) => {
        result[`${key}-${num}`] = value;
      });
    });
    return result;
  }

  /**
   *
   * @protected
   * @deprecated
   */
  protected isExtraEmailsIsUnique() {
    const emails = [];

    emails.push(this.group.get('email').value);

    for (let i = 1; i <= this.extraGuestsCount; i++) {
      const emailField = this.group.get("extraGuests." + (i - 1) + ".email-" + i);
      const email = emailField.value;
      if (emails.includes(email)) {
        emailField.setErrors({
          message: "Email is not unique"
        });
        return false;
      } else {
        emails.push(email);
      }
    }
    return true;
  }

  async processSubmit() {

    if (this.waiverRequired) {
      let fname = this.group.get('first_name').value;
      const agree = this.group.get('agree').value;
      if (agree === null || (agree).trim() == "") {
        this.group.get('agree').setErrors({
          message: "Type Your First Name To Agree"
        });
        markAllFormControlsAsTouched(this.group, false);
        return false;
      } else {
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

    // if (!this.isExtraEmailsIsUnique()) {
    //   markAllFormControlsAsTouched(this.group, false);
    //   return false;
    // }
    if (this.waiverRequired) {
      const extraGuestsArray = this.group.get('extraGuests') as FormArray;
      if (extraGuestsArray) {
        for (let i = 0; i < extraGuestsArray.length; i++) {
          const extraGroup = extraGuestsArray.at(i) as FormGroup;
          const sameAsMain = extraGroup.get('sameAsMainGuest').value;
          const agreeControl = extraGroup.get('agree');
          const firstNameControl = extraGroup.get('first_name');
          if (!sameAsMain) {
            const agreeValue = (agreeControl.value || '').trim().toUpperCase();
            const firstNameValue = (firstNameControl.value || '').trim().toUpperCase();
            if (agreeValue === '' || agreeValue !== firstNameValue) {
              agreeControl.setErrors({
                message: "Type Your First Name To Agree"
              });
              markAllFormControlsAsTouched(this.group, false);
              return false;
            }
          } else {
            agreeControl.setValue(firstNameControl.value.toUpperCase());
          }
        }
      }
    }

    markAllFormControlsAsTouched(this.group);

    const data = this.group.getRawValue();
    data['code'] = this.guest.token;

    if (this.extraGuestsCount > 0) {
      data['extraGuestsObjects'] = data['extraGuests'];
      data['extraGuests'] = this.makePlainExtra(data['extraGuests']);
    } else {
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

      this.checkService.register(this.guest, data, null, this.onlyUpdate)
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
                this.guest.isActive = true;
                this.closed.emit(response);
              }
            } else {
              console.log(response);
              this.guest.isActive = true;
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

  public agreeExtraChange(ev, ii) {
    if (ev && ev.target) {
      const extraGroup = this.extraGuests.at(ii) as FormGroup;
      const sameAsMain = extraGroup.get('sameAsMainGuest').value;
      const agreeControl = extraGroup.get('agree');
      if (sameAsMain) {
        agreeControl.setValue(this.guest.firstName.toUpperCase());
      } else {
        agreeControl.setValue((ev.target.value || '').toUpperCase());
      }
    }
  }

  toggleSameAsMain(extraGroup, index: number) {
    const sameAsMain = extraGroup.get('sameAsMainGuest').value;
    const keys = {
      'first_name': 'firstName',
      'last_name': 'lastName',
      'email': 'email',
      'phone': 'phone',
      'agree': 'agree'
    };
    Object.keys(keys).forEach(key => {
      const control = extraGroup.get(`${key}`);
      if (sameAsMain) {
        control.setValue(this.guest[keys[key]]);
        control.disable();
      } else {
        control.reset();
        control.enable();
      }
    });
  }

  removeExtraGuest(index: number) {
    const extras = this.group.get('extraGuests') as FormArray;
    if (extras && extras.length > index) {
      extras.removeAt(index);
    }
  }

  skipExtraGuest(num: number) {

  }


  addExtraGuest() {
    const purchaser = this.guest.purchaser;
    const purchaserGuests = this.tourDate.guests.filter(guest => !guest.isPurchaserGuest && guest.purchaserId === purchaser.id && guest.isRegistered !== true);
    const extras = this.group.get('extraGuests') as FormArray;
    const usedGuids = extras.controls.map(ctrl => ctrl.get('guid')?.value);
    const unusedGuest = purchaserGuests.find(guest => !usedGuids.includes(guest.guid));
    if (!unusedGuest) return;

    const index = extras.length;
    const newGuestGroup: FormGroup = this.formBuilder.group({
      first_name: [unusedGuest.firstName || '', Validators.required],
      last_name: [unusedGuest.lastName || '', Validators.required],
      email: [unusedGuest.email || ''],
      phone: [unusedGuest.phone || ''],
      guid: [unusedGuest.guid || '', Validators.required],
      sameAsMainGuest: [unusedGuest.sameAsMain || false],
      notes: [unusedGuest.notes || ''],
      num: [index],
      is_active: [unusedGuest.isActive]
    });

    newGuestGroup.controls["first_name"]['error_messages'] = {
      'required': 'First Name is required.'
    };
    newGuestGroup.controls["last_name"]['error_messages'] = {
      'required': 'Last Name is required.'
    };

    newGuestGroup.controls["email"]['error_messages'] =
      {
        'required': 'Email is required.',
        'email': 'Email is not valid.',
      };
    newGuestGroup.controls["phone"]['error_messages'] = {
      'required': 'Phone is required.'
    };

    if (this.waiverRequired) {
      newGuestGroup.addControl('agree', new FormControl(null, Validators.required));

      // @ts-ignore
      newGuestGroup.controls['agree']['error_messages'] = {
        'required': 'Agreement is required.'
      };

    } else {
      newGuestGroup.addControl('agree', new FormControl(null));
    }

    extras.push(newGuestGroup);
  }

  canAddExtraGuest(): boolean {
    if (!this.guest?.purchaser || !this.extraGuests) return false;
    const all = this.tourDate.guests.filter(g => g.purchaserId === this.guest.purchaser.id && !g.isRegistered && !g.isPurchaserGuest);
    return this.extraGuests.length < all.length;
  }

  toggleSameAsMainForSingle() {
    const sameAsMain = this.group.get('sameAsMainGuest')?.value;
    const purchaserGuest = this.tourDate.guests.find(g => g.purchaserId === this.guest.purchaserId && g.isPurchaserGuest);
    if (!purchaserGuest) return;

    const keys = {first_name: 'firstName', last_name: 'lastName', email: 'email', phone: 'phone'};
    Object.keys(keys).forEach(key => {
      const ctrl = this.group.get(key);
      if (!ctrl) return;
      if (sameAsMain) {
        ctrl.setValue(purchaserGuest[keys[key]]);
        ctrl.disable();
      } else {
        ctrl.reset();
        ctrl.enable();
      }
    });
  }
}
