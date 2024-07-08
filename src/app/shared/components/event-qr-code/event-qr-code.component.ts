import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import QRCode from "easyqrcodejs";

@Component({
  selector: 'app-event-qr-code',
  templateUrl: './event-qr-code.component.html',
  styleUrls: ['./event-qr-code.component.scss'],
})
export class EventQrCodeComponent  implements OnInit, AfterViewInit {
  @ViewChild('qrcode', {static: false}) qrcode: ElementRef;

  @Input() code: string;

  constructor() { }

  ngOnInit() {}

  ngAfterViewInit(){
    if (this.code) {
      this.drawQrCode(this.code)
    }
  }

  drawQrCode(text) {
    var options = {
      text: text
    }

    // Create new QRCode Object
    if (this.qrcode) {
      new QRCode(this.qrcode.nativeElement, options);
    }
  }

}
