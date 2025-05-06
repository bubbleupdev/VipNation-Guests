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
import {IPurchaser} from "../../../interfaces/purchaser";
import {IAny} from "../../../interfaces/any";

@Component({
  selector: 'app-update-purchaser-form',
  templateUrl: './update-purchaser-form.component.html',
  styleUrls: ['./update-purchaser-form.component.scss'],
})
export class UpdatePurchaserFormComponent  implements OnInit {

//    interface IPurchaser  extends IAny{
//   id: number
//   firstName: string
//   lastName: string
//   email: string
//   phone: string
//   tourDateInstanceId: number
//   guestsCount: number
//   checkedInGuests: number
//   maxGuests: number
//   extraGuests: number
//   waiverRequired: boolean
//   waiverText: string
//   notes: string
//   details: any
//   isRegistrationSent: boolean;
//   isRegistered: boolean;
//   listId: number;
// }

  @Input() purchaser: IPurchaser = null;
  @Input() tourDate: ITourDate = null;
  @Output() closedUpdatePurchaser: EventEmitter<any> = new EventEmitter<any>();

  public group: FormGroup | undefined;
  public inProgress: boolean = false;

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

    if (this.purchaser) {

      this.group = this.formBuilder.group({
        first_name: [this.purchaser.firstName, [Validators.required]],
        last_name: [this.purchaser.lastName, [Validators.required]],
        email: [this.purchaser.email, [Validators.required, Validators.email]],
        phone: [this.purchaser.phone, [Validators.required]],
        notes: [this.purchaser.notes || '', []],
        detailsArray: this.formBuilder.array([])
      });

      const detailsObj = this.purchaser.details || {};
      const detailsFormArray: FormArray = this.group.get('detailsArray') as FormArray;
      for (const key in detailsObj) {
        detailsFormArray.push(this.formBuilder.group({
          key: [key, Validators.required],
          value: [detailsObj[key], Validators.required]
        }));
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

    }
  }


  public getControl(extraGroup, name) {
    return extraGroup.get(name) as FormControl;
  }

  public close() {
    this.closedUpdatePurchaser.emit({'status': 'skip'});
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


  async processSubmit() {
    // Removed waiver logic for purchaser update: no waiver validation for purchaser update.

    // if (!this.isExtraEmailsIsUnique()) {
    //   markAllFormControlsAsTouched(this.group, false);
    //   return false;
    // }

    const data = this.group.getRawValue();
    markAllFormControlsAsTouched(this.group);


    // Restore logic for handling detailsArray when updating purchaser
    if (this.purchaser) {
      const detailsArray = this.group.get('detailsArray') as FormArray;
      const detailsObject = {};
      detailsArray.controls.forEach((ctrl: FormGroup) => {
        const key = ctrl.get('key')?.value;
        const value = ctrl.get('value')?.value;
        if (key) detailsObject[key] = value;
      });
      data['details'] = detailsObject;
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

      this.checkService.updatePurchaser(this.purchaser, data,)
        .then((response) => {
            if (response['result'] === 'ok') {
              const result = response.response.data['submitForm'];
              if (false && result.errors !== null && result.errors.length > 0) {
                const preparedErrors = this.formSubmitService.prepareFormErrors(result.errors);
                this.formSubmitService.setFormErrors(this.group, preparedErrors);

              } else {
                console.log(result);
                this.closedUpdatePurchaser.emit(response);
              }
            } else {
              console.log(response);
              this.closedUpdatePurchaser.emit(response);
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
    this.group.controls['captcha'].setErrors({'message': 'Update error '});
  }

  protected capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }


  addDetail() {
    debugger;
    const detailsArray = this.group.get('detailsArray') as FormArray;
    detailsArray.push(this.formBuilder.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    }));
  }

  removeDetail(index: number) {
    debugger;
    const detailsArray = this.group.get('detailsArray') as FormArray;
    if (detailsArray && detailsArray.length > index) {
      detailsArray.removeAt(index);
    }
  }

  public detailControls(group) {
    return (group.get('detailsArray') as FormArray).controls;
  }
}
