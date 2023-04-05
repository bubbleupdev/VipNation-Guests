import { Component, Input } from "@angular/core";
import {AbstractControl, FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: "bubbleup-validation-control",
  templateUrl: "./validation-control.component.html",
  styleUrls: ["./validation-control.component.scss"]
})
export class ValidationControlComponent {
  @Input()
  control: FormControl | FormGroup | AbstractControl;

  constructor() {}
}
