import { Injectable } from '@angular/core';
import {IGuests} from "../interfaces/guest";
import {IEvents} from "../interfaces/page";

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  public strongSearch: boolean = false;

  constructor() {
  }

  public tok(s, chars, rtl = false) {
    var n, i = chars.length;
    rtl = true === rtl;
    while (i--) {
      n = s.indexOf(chars[i]);
      s = n < 0 ? s : rtl
        ? s.substr(++n)
        : s.substr(0, n);
    }
    return s;
  }

  public searchInEvents(query, events: IEvents) {
    const tokens = this.tokenizer(query);
    let items = [];
    if (events) {
      events.forEach((event) => {
        const item = {
          item: event,
          level: 0,
          data: [event.name]
        };
        items.push(item);
      });
    }
    const foundEvents = this.searchIn(tokens, items);
    const filteredEvents = [];
    foundEvents.forEach((foundEvent) => {
      filteredEvents.push(foundEvent.item);
    });

    return filteredEvents;
  }

  public searchInGuests(query, guests: IGuests) {
    const tokens = this.tokenizer(query);
    let items = [];
    if (guests) {
      guests.forEach((guest) => {
        const item = {
          item: guest,
          level: 0,
          data: [guest.firstName, guest.lastName, guest.email]
        };
        items.push(item);
      });
    }

    const foundGuests = this.searchIn(tokens, items);
    const filteredGuests = [];
    foundGuests.forEach((foundGuest) => {
      filteredGuests.push(foundGuest.item);
    });

    return filteredGuests;
  }


  protected tokenizer(query: string) {

    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const delimiters = ' .@';

    function isChar(c) {
      return (letters.indexOf(c) !== -1);
    }

    function isNum(c) {
      return (digits.indexOf(c) !== -1);
    }

    function isDelim(c) {
      return (delimiters.indexOf(c) !== -1);
    }

    function getType(c) {
      if (isChar(c)) return 'c';
      if (isNum(c)) return 'n';
      return 'd';
    }

    let str = query.toLowerCase();
    let cType = 'd';
    const tokens = [];
    let token = "";


    for (let i = 0; i < query.length; i++) {
      let nType = getType(str[i]);
      if (nType !== cType) {
        if (token) {
          tokens.push(token);
          token = "";
        }
        cType = nType;
      }
      if (nType !== 'd') {
        token += "" + str[i];
      }
    }
    if (token) {
      tokens.push(token);
    }
    return tokens;
  }


  protected searchIn(tokens, items) {

    const matches = [];

    items.forEach((item) => {
      const len = item['data'].length;

      let pattern = '';
      if (this.strongSearch) {
        pattern = '(' + tokens.join(".*?)(") + ')';
      }
      else {
        pattern = '(' + tokens.join(".*?)|(") + ')';
      }

      const reg = new RegExp(pattern, "g");

      let level = 0;
      // let matched = false;
      // item['data'].forEach((el: string) => {
      //   const match = el.toLowerCase().match(reg);
      //   if (match) {
      //     matched = true;
      //     level += match.length;
      //   }
      // });

      let matched = false;
      let allItems = '';
      item['data'].forEach((el: string) => {
        allItems += " " + el;
      });

      const match = allItems.toLowerCase().match(reg);
      if (match) {
        matched = true;
        level += match.length;
      }


      if (matched) {
        item['level'] = level;
        matches.push(item);
      }

    });

    matches.sort((a, b) => {
      return b['level'] - a['level'];
    });

    return matches;
  }

}
