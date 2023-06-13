import {Component, ElementRef, EventEmitter, OnInit, Input, Output, ViewChild} from '@angular/core';
import {LoadingController} from '@ionic/angular';
import {Router, UrlTree} from '@angular/router';
//import {RecaptchaInputComponent} from "../../inputs/recaptcha-input/recaptcha-input.component";
import {IFormComponentInterface} from "../../../interfaces/form-component-interface";
import {DomSanitizer} from "@angular/platform-browser";
import {Subscription} from "rxjs";
import {AuthService} from "../../../services/auth.service";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {UserService} from "../../../services/user.service";
import {markAllFormControlsAsTouched} from "../../../helpers/data.helper";

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit {

  @ViewChild('submitButton') submitButton: ElementRef | undefined;

//  @ViewChild('recaptchaInputRef') recaptchaInputRef: RecaptchaInputComponent;

  @Output() loginSuccess: EventEmitter<Event> = new EventEmitter<Event>();

  @Input() buttonLabel = 'Login';

  @Input() redirectTo: string | UrlTree = '/select-event';
  public group: FormGroup | undefined;

  private sub: Subscription | undefined;

  public inProgress: boolean = false;

  constructor(
    private authService: AuthService,
    public formBuilder: FormBuilder,
    private userService: UserService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private loadingCtrl: LoadingController,
  ) {}

  // public emailInput = new FormControl('', [Validators.required]);
  // public passwordInput = new FormControl('', [Validators.required]);

  // public emailInput = new FormControl('testrustos4@gmail.com', [Validators.required]);
  // public passwordInput = new FormControl('!Q2w3e4r', [Validators.required]);


  // setRedirectTo(redirectTo: string): void {
  //   this.redirectTo = redirectTo;
  // }

  ngOnInit() {

    this.group = this.formBuilder.group({
      email: ['testrustos@gmail.com', [Validators.required]],
      password: ['Test1234!', [Validators.required]],
    });

    // @ts-ignore
    this.group.controls.email['error_messages'] = {
      'required': 'Email or username is required.'
    };
    // @ts-ignore
    this.group.controls.password['error_messages'] = {
      'required': 'Password is required.'
    };
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  // public validateInputs() {
  //   const inputsValid = this.emailInput.valid && this.passwordInput.valid;
  //   return inputsValid;
  // }

  public async processSubmit() {
    const loading = await this.loadingCtrl.create({
      message: 'Signing In',
      spinner: 'dots',
    });

    if (this.group.invalid) {

      return markAllFormControlsAsTouched(this.group);
    }

    if (!this.group.valid) {
      return false;
    } else {

      this.disableSubmitButton();
      loading.present();

      this.authService.login(this.group.controls['email'].value, this.group.controls['password'].value).subscribe((data: any) => {

          if (data === null || data === undefined || data.data.getUserToken === null || data.data.getUserToken === undefined) {
            this.displayError();
            this.enableSubmitButton();
            loading.dismiss();
          } else {
            this.userService.initCurrentUser(true).subscribe(user => {

                this.enableSubmitButton();
                loading.dismiss();
                this.processSuccess();
                this.router.navigate([this.redirectTo]);

                // if (roles.includes('RegisteredMember')) {
                // } else {
                //   this.router.navigate(['/logout']);
                // }
              },
              (error) => {
                this.enableSubmitButton();
                loading.dismiss();
              });
          }
        },
        (error) => {
          this.enableSubmitButton();
          loading.dismiss();
          this.displayError();
        });
    }
  }

  protected disableSubmitButton() {
    this.inProgress = true;
  }

  protected enableSubmitButton() {
    this.inProgress = false;
  }

  protected processSuccess() {

    this.group.reset('');

    this.loginSuccess.emit();
  }

  public displayError() {
    this.group.controls['password'].setErrors({'message': 'Invalid username or password'});
  }


}
