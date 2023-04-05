import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ValidationControlComponent } from "./validation-control.component";

import {} from "jasmine";
import { ValidationMessagePipe } from "../../pipes/validation-message.pipe";
import { FormControl, Validators } from "@angular/forms";

describe("ValidationControlComponent", () => {
  let component: ValidationControlComponent;
  let fixture: ComponentFixture<ValidationControlComponent>;
  let control: FormControl;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ValidationControlComponent,
        ValidationMessagePipe
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidationControlComponent);
    component = fixture.componentInstance;

    control = new FormControl("", Validators.required);
    component.control = control;
    fixture.detectChanges();
  });

  it("should show error if control is touched", () => {
    let errorEl: HTMLElement;

    control.markAsUntouched();
    errorEl = fixture.nativeElement.querySelector(".validation-control__error");
    expect(errorEl).toBeFalsy("hidden if untouched");

    control.markAsTouched();
    fixture.detectChanges();

    errorEl = fixture.nativeElement.querySelector(".validation-control__error");
    expect(errorEl).toBeTruthy("displayed if touched");
  });
});
