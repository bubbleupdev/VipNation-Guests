import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectEventPage } from './select-event.page';

const routes: Routes = [
  {
    path: '',
    component: SelectEventPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectEventPageRoutingModule {}
