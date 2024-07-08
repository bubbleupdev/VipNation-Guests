// import * as moment from 'moment/moment';
import {AbstractControl, FormArray, FormControl, FormGroup} from "@angular/forms";
import moment from "moment/moment";

export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const sDayNames = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const recipeTypes = [
  'breakfast',
  'snack',
  'lunch',
  'dinner',
  'second_snack'
];

export const recipeTypeTitles = {
  'breakfast': 'Breakfast',
  'snack': 'Snack',
  'lunch': 'Lunch',
  'dinner': 'Dinner',
  'second_snack': 'Second Snack'
};

export function upFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function downFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

//  Formatted version of a popular md5 implementation
//  Original copyright (c) Paul Johnston & Greg Holt.
//  The function itself is now 42 lines long.

export function md5(inputString) {
  var hc="0123456789abcdef";
  function rh(n) {var j,s="";for(j=0;j<=3;j++) s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
  function ad(x,y) {var l=(x&0xFFFF)+(y&0xFFFF);var m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
  function rl(n,c)            {return (n<<c)|(n>>>(32-c));}
  function cm(q,a,b,x,s,t)    {return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
  function ff(a,b,c,d,x,s,t)  {return cm((b&c)|((~b)&d),a,b,x,s,t);}
  function gg(a,b,c,d,x,s,t)  {return cm((b&d)|(c&(~d)),a,b,x,s,t);}
  function hh(a,b,c,d,x,s,t)  {return cm(b^c^d,a,b,x,s,t);}
  function ii(a,b,c,d,x,s,t)  {return cm(c^(b|(~d)),a,b,x,s,t);}
  function sb(x) {
    var i;var nblk=((x.length+8)>>6)+1;var blks=new Array(nblk*16);for(i=0;i<nblk*16;i++) blks[i]=0;
    for(i=0;i<x.length;i++) blks[i>>2]|=x.charCodeAt(i)<<((i%4)*8);
    blks[i>>2]|=0x80<<((i%4)*8);blks[nblk*16-2]=x.length*8;return blks;
  }
  var i,x=sb(""+inputString),a=1732584193,b=-271733879,c=-1732584194,d=271733878,olda,oldb,oldc,oldd;
  for(i=0;i<x.length;i+=16) {olda=a;oldb=b;oldc=c;oldd=d;
    a=ff(a,b,c,d,x[i+ 0], 7, -680876936);d=ff(d,a,b,c,x[i+ 1],12, -389564586);c=ff(c,d,a,b,x[i+ 2],17,  606105819);
    b=ff(b,c,d,a,x[i+ 3],22,-1044525330);a=ff(a,b,c,d,x[i+ 4], 7, -176418897);d=ff(d,a,b,c,x[i+ 5],12, 1200080426);
    c=ff(c,d,a,b,x[i+ 6],17,-1473231341);b=ff(b,c,d,a,x[i+ 7],22,  -45705983);a=ff(a,b,c,d,x[i+ 8], 7, 1770035416);
    d=ff(d,a,b,c,x[i+ 9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,     -42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
    a=ff(a,b,c,d,x[i+12], 7, 1804603682);d=ff(d,a,b,c,x[i+13],12,  -40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);
    b=ff(b,c,d,a,x[i+15],22, 1236535329);a=gg(a,b,c,d,x[i+ 1], 5, -165796510);d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
    c=gg(c,d,a,b,x[i+11],14,  643717713);b=gg(b,c,d,a,x[i+ 0],20, -373897302);a=gg(a,b,c,d,x[i+ 5], 5, -701558691);
    d=gg(d,a,b,c,x[i+10], 9,   38016083);c=gg(c,d,a,b,x[i+15],14, -660478335);b=gg(b,c,d,a,x[i+ 4],20, -405537848);
    a=gg(a,b,c,d,x[i+ 9], 5,  568446438);d=gg(d,a,b,c,x[i+14], 9,-1019803690);c=gg(c,d,a,b,x[i+ 3],14, -187363961);
    b=gg(b,c,d,a,x[i+ 8],20, 1163531501);a=gg(a,b,c,d,x[i+13], 5,-1444681467);d=gg(d,a,b,c,x[i+ 2], 9,  -51403784);
    c=gg(c,d,a,b,x[i+ 7],14, 1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+ 5], 4,    -378558);
    d=hh(d,a,b,c,x[i+ 8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16, 1839030562);b=hh(b,c,d,a,x[i+14],23,  -35309556);
    a=hh(a,b,c,d,x[i+ 1], 4,-1530992060);d=hh(d,a,b,c,x[i+ 4],11, 1272893353);c=hh(c,d,a,b,x[i+ 7],16, -155497632);
    b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13], 4,  681279174);d=hh(d,a,b,c,x[i+ 0],11, -358537222);
    c=hh(c,d,a,b,x[i+ 3],16, -722521979);b=hh(b,c,d,a,x[i+ 6],23,   76029189);a=hh(a,b,c,d,x[i+ 9], 4, -640364487);
    d=hh(d,a,b,c,x[i+12],11, -421815835);c=hh(c,d,a,b,x[i+15],16,  530742520);b=hh(b,c,d,a,x[i+ 2],23, -995338651);
    a=ii(a,b,c,d,x[i+ 0], 6, -198630844);d=ii(d,a,b,c,x[i+ 7],10, 1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);
    b=ii(b,c,d,a,x[i+ 5],21,  -57434055);a=ii(a,b,c,d,x[i+12], 6, 1700485571);d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
    c=ii(c,d,a,b,x[i+10],15,   -1051523);b=ii(b,c,d,a,x[i+ 1],21,-2054922799);a=ii(a,b,c,d,x[i+ 8], 6, 1873313359);
    d=ii(d,a,b,c,x[i+15],10,  -30611744);c=ii(c,d,a,b,x[i+ 6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21, 1309151649);
    a=ii(a,b,c,d,x[i+ 4], 6, -145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+ 2],15,  718787259);
    b=ii(b,c,d,a,x[i+ 9],21, -343485551);a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
  }
  return rh(a)+rh(b)+rh(c)+rh(d);
}


export const markAllFormControlsAsTouched = (formGroup: FormGroup | any, clearMessage : boolean = true): void => {

  if (clearMessage) {
    if (formGroup.hasError('message')) {
      formGroup.errors['message'] = null;
      formGroup.updateValueAndValidity();
    }
  }

  Object.keys(formGroup.controls).forEach(field => {

    const control: any = formGroup.get(field);

      if (control instanceof FormControl) {

        if (clearMessage) {
          if (control.hasError('message')) {
            control.errors['message'] = null;
            control.updateValueAndValidity();
          }
        }

        control.markAsTouched({onlySelf: true});
      } else if (control instanceof FormGroup) {
        markAllFormControlsAsTouched(control, clearMessage);
      } else if (control instanceof FormArray) {
        markAllFormControlsAsTouched(control, clearMessage);
      }
  });
};

export function nl2br(str, is_xhtml) {
  var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>';

  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

export class DataHelper {
  static dateArray = [];

  public static isNotEmptyString(value) {
    return (value !== undefined &&
      value !== null &&
      value !== '' &&
      typeof value === 'string'
    );
  }

  public static isNotEmpty(value) {
    return (value !== undefined &&
      value !== null
    );
  }

  public static isNotEmptyArray(value) {
    return (value instanceof Array &&
      value.length > 0);
  }

  public static isEmptyArray(value) {
    return (value instanceof Array &&
      value.length === 0);
  }

  public static isAppropriateNumber(value) {
    if (this.isNotEmpty(value) && !isNaN(value)) {
      return true;
    }

    return false;
  }

  public static getDateFromString(dateString) {
    if (DataHelper.dateArray[dateString]) {
      return DataHelper.dateArray[dateString];
    } else {
      DataHelper.dateArray[dateString] = new Date(moment(dateString).format());
      return DataHelper.dateArray[dateString];
    }
  }

  //
  // public static getHumanDateString(baseDate) {
  //     return moment(baseDate).utcOffset(baseDate).format('MM/DD/YYYY hh:mm A');
  // }

  // public static getTimestampByUtcOffset(utcOffset) {
  //     return moment().utc(false).add(utcOffset, 'minutes').unix() * 1000;
  // }

  public static isEmptyHtml(value) {
    if (this.isNotEmptyString(value)) {

      let filterValue = value.replace(/<script[^>]*>(?:[^<]+|<(\/script>))+/g, '');
      filterValue = filterValue.replace(/<[^>]*>/g, '');
      filterValue = filterValue.replace(/\[(.*?)\]/g, '');
      filterValue = filterValue.replace(/\[[a-zA-Z0-9]*]/g, '');
      filterValue = filterValue.replace(/\s\s/g, '');
      filterValue = filterValue.replace(/(?=lt;)(.*)(?=gt)/g, '');
      filterValue = filterValue.replace(/\&amp/g, '');
      filterValue = filterValue.replace(/amp/g, '');
      filterValue = filterValue.replace(/gt\;/g, '');
      filterValue = filterValue.replace(/lt\;/g, '');
      filterValue = filterValue.replace(/(\.+)/g, '');

      return !this.isNotEmptyString(filterValue);
    }

    return true;
  }

  public static fixLinksInText(text) {
    let match = text.match('\<a href\=\"(.*?)\"[^\>]*>');

    while (match != null) {

      const replacement = match.value[0].replace(/"/g, '\'')
        .replace('href=', 'target=\'_blank\' href=')
        .replace(/\\\'/g, '');

      text = text.replace(match.value[0], replacement);


      match = text.match('\<a href\=\"(.*?)\"[^\>]*>');
    }

    return text;
  }

  public static pad(n) {
    return n < 10 ? '0' + n : n;
  }


  public static getFormattedDateFromString(dateString, withHms = false) {
    const dt = new Date(dateString);

    const hms = (withHms) ? ' ' + this.pad(dt.getHours()) + ':' + this.pad(dt.getMinutes()) + ':' + this.pad(dt.getSeconds()) : '';

    return (monthNames[dt.getMonth() + 1]) + ' ' + this.pad(dt.getDate()) + ' ' + dt.getFullYear().toString() + hms;
  }

  public static getFormattedDateFromUtc(dateNum: number, withHms = false) {
    const dt = new Date(dateNum);

    const hms = (withHms) ? ' ' + this.pad(dt.getHours()) + ':' + this.pad(dt.getMinutes()) + ':' + this.pad(dt.getSeconds()) : '';

    return (monthNames[dt.getMonth() + 1]) + ' ' + this.pad(dt.getDate()) + ' ' + dt.getFullYear().toString() + hms;
  }

}
