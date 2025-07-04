import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {RouteButtonComponent} from "./components/route-button/route-button.component";
import {LoginFormComponent} from "./forms/login-form/login-form.component";
import {LookupFormComponent} from "./forms/lookup-form/lookup-form.component";
import {ValidationControlComponent} from "./form-elements/validation-control/validation-control.component";
import {ShowHidePasswordComponent} from "./components/show-hide-password/show-hide-password.component";
import {TitleComponent} from "./components/title/title.component";
import {SelectEventFormComponent} from "./forms/select-event-form/select-event-form.component";
import {SendSmsFormComponent} from "./forms/send-sms-form/send-sms-form.component";
import {RegistrationFormComponent} from "./forms/registration-form/registration-form.component";
import {GuestListComponent} from "./components/guest-list/guest-list.component";
import {FocusNextDirective} from "./directives/focusnext.directive";
import {EventQrCodeComponent} from "./components/event-qr-code/event-qr-code.component";
import {EventGuestListsComponent} from "./components/event-guest-lists/event-guest-lists.component";
import {UpdatePurchaserFormComponent} from "./forms/update-purchaser-form/update-purchaser-form.component";


const declarationsAndExports = [
  RouteButtonComponent,
  LoginFormComponent,
  LookupFormComponent,
  ValidationControlComponent,
  ShowHidePasswordComponent,
  TitleComponent,
  SelectEventFormComponent,
  SendSmsFormComponent,
  RegistrationFormComponent,
  GuestListComponent,
  FocusNextDirective,
  EventQrCodeComponent,
  EventGuestListsComponent,
  UpdatePurchaserFormComponent
];

@NgModule({
  entryComponents: [],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
  ],
  declarations: [
    declarationsAndExports,
  ],
  exports: [
    declarationsAndExports,
    FormsModule,
    ReactiveFormsModule,
  ],
   schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class SharedModule {}
