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
import {DataHelper, markAllFormControlsAsTouched} from "../../../helpers/data.helper";
import {DataService} from "../../../services/data.service";
import {LogService} from "../../../services/log.service";

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
    private dataService: DataService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private loadingCtrl: LoadingController,
  ) {}

  ngOnInit() {

    this.group = this.formBuilder.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
      // email: ['testrustos@gmail.com', [Validators.required]],
      // password: ['Test1234!', [Validators.required]],
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
            this.dataService.loadContent().subscribe((ev) => {
              console.log('All events loaded');
              LogService.log('All events loaded', ev);

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
            });
          }
        },
        (error) => {
          this.enableSubmitButton();
          loading.dismiss();
          this.displayError(error);
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

  public displayError(err = null) {
    let message = 'Invalid username or password';

    if (err && DataHelper.isNotEmptyString(err)) {
      message = err;
    }
    const data = {
      message: message
    };
    this.group.controls['password'].setErrors(data);
    markAllFormControlsAsTouched(this.group, false);
  }


}
