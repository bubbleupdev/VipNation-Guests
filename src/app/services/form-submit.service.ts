import { Injectable } from '@angular/core';
import {markAllFormControlsAsTouched} from "../helpers/data.helper";
import {FormGroup} from "@angular/forms";
import {IFormError} from "../interfaces/form-error";

@Injectable({
  providedIn: 'root'
})
export class FormSubmitService {

  constructor() { }


  public prepareFormErrors(errors) {
    const formErrors: any = [];
    if (errors && errors.length > 0) {
      errors.forEach(error => {
        if (error.inputName) {
          formErrors.push({
            formControlName: error.inputName, //this.formMapper(error.inputName),
            message: error.errors.join("\n")
          });
        }
      });
    }
    return formErrors;
  }

  public setFormErrors(
    formGroup: FormGroup,
    formErrors: IFormError[]
  ): void {
    const formGroupErrors: string[] = [];
    const formControlErrors: Record<string, string[]> = {};

    // @ts-ignore
    formErrors.forEach(item => {
      const formControlName = item.formControlName;

      if (!formControlName) {
        return formGroupErrors.push(item.message);
      }

      const formControl = formGroup.get(formControlName);

      if (formControl) {
        if (!formControlErrors[formControlName]) {
          formControlErrors[formControlName] = [];
        }
        formControlErrors[formControlName].push(item.message);
      } else {
        formGroupErrors.push(item.message);
      }
    });

    if (formGroupErrors.length) {
      formGroup.setErrors({
        message: formGroupErrors
      });
    }

    for (const formControlName in formControlErrors) {
      const formControl = formGroup.get(formControlName);

      formControl.setErrors({
        message: formControlErrors[formControlName]
      });
    }

    markAllFormControlsAsTouched(formGroup, false);
  };

}
