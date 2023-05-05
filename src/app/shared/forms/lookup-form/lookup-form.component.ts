import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-lookup-form',
  templateUrl: './lookup-form.component.html',
  styleUrls: ['./lookup-form.component.scss'],
})
export class LookupFormComponent  implements OnInit {

  public group: FormGroup | undefined;

  public inProgress: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.group = this.formBuilder.group({
      event: ['', [Validators.required]],
      guest: ['', [Validators.required]],
    });
  }

  public async processSubmit() {
    return;
  }

}
