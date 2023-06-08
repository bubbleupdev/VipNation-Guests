import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SelectEventPageRoutingModule } from './select-event-routing.module';

import { SelectEventPage } from './select-event.page';
import {SharedModule} from "../../shared/shared.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SelectEventPageRoutingModule,
    SharedModule
  ],
  declarations: [SelectEventPage]
})
export class SelectEventPageModule {}
