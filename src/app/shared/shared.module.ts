import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {RouteButtonComponent} from "./components/route-button/route-button.component";
import {LoginFormComponent} from "./forms/login-form/login-form.component";
import {ValidationControlComponent} from "./form-elements/validation-control/validation-control.component";
import {ShowHidePasswordComponent} from "./components/show-hide-password/show-hide-password.component";
import {HeaderComponent} from "./components/header/header.component";


const declarationsAndExports = [
  RouteButtonComponent,
  LoginFormComponent,
  ValidationControlComponent,
  ShowHidePasswordComponent,
  HeaderComponent
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
