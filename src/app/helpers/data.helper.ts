import * as moment from 'moment/moment';
import {AbstractControl, FormArray, FormControl, FormGroup} from "@angular/forms";

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

export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
