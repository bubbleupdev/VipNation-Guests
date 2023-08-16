import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SendSmsPageRoutingModule } from './send-sms-routing.module';

import { SendSmsPage } from './send-sms.page';
import {SharedModule} from "../../shared/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SendSmsPageRoutingModule,
    SharedModule,
  ],
  declarations: [SendSmsPage]
})
export class SendSmsPageModule {}
