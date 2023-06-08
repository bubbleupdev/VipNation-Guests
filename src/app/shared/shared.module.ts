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


const declarationsAndExports = [
  RouteButtonComponent,
  LoginFormComponent,
  LookupFormComponent,
  ValidationControlComponent,
  ShowHidePasswordComponent,
  TitleComponent,
  SelectEventFormComponent
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
