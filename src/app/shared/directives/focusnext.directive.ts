import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[vnFocusNext]'
})
export class FocusNextDirective {

  @Input('vnFocusNext')
  public enabled: boolean;

  constructor() { }

  @HostListener('keydown', ['$event'])
  public onInputChange(e: KeyboardEvent) {
    if (this.enabled) {
      var code = e.keyCode || e.which;

      if (code === 13) {
        e.preventDefault();
        let control: HTMLInputElement = <HTMLInputElement>e.srcElement;

        while (control) {
          let nextControl = <HTMLInputElement>control.nextElementSibling;

          if (nextControl) {
            control = nextControl;

            while (nextControl && (!this.isFocusable(nextControl))) {
              control = nextControl;
              nextControl = <HTMLInputElement>nextControl.firstElementChild;
            }

            if (nextControl) {
              control = nextControl;
              break;
            }
          } else {
            control = <HTMLInputElement>control.parentElement;
          }
        }

        if (control && control.focus) {
          control.focus();
        }
      }
    }
  }

  private isFocusable(control: HTMLInputElement): boolean {
    console.log('NodeName: ' + control.nodeName);
    return (
      (!control.hidden) &&
      (
        control.nodeName == 'INPUT' ||
//        control.nodeName == 'SELECT' ||
        control.nodeName == 'BUTTON' ||
        control.nodeName == 'TEXTAREA'
      )
    );
  }
}
