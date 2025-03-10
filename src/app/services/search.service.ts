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
        const data = [guest.firstName, guest.lastName, guest.email, guest.phone];

        if (guest.purchaser) {
          if (guest.purchaser.notes) {
            data.push(guest.purchaser.notes);
          }
          if (guest.purchaser.details) {
            for (const key in guest.purchaser.details) {
              if (guest.purchaser.details[key]) {
                data.push(guest.purchaser.details[key]);
              }
            }
          }
        }

        const item = {
          item: guest,
          level: 0,
          data: data
        };
        items.push(item);
      });
    }

    const foundGuests = this.searchIn(tokens, items);
    return foundGuests.map(foundGuest => foundGuest.item);
  }


  protected tokenizer(query: string) {
    const tokens: string[] = [];

    // Split by numbers and punctuation
    const token1 = query.split(/[ 1234567890\/.,]+/).filter(Boolean);
    tokens.push(...token1);

    // Split by letters
    const token2 = query.split(/[ abcdefghijklmnopqrstuvwxyz]+/i);
    tokens.push(...token2);

    // Split by special symbols
    const token2Special = query.split(/[ @\.\-,\/]/);
    token2Special.forEach(tok => {
      if (tok && !tokens.includes(tok)) {
        tokens.push(tok);
      }
    });

    return tokens;
  }


  protected searchIn(tokens: string[], items: any[]) {
    const matches = [];

    items.forEach((item) => {
      const allItems = item.data.join(' ').toLowerCase();
      let level = 0;

      tokens.forEach(token => {
        const tokenReg = new RegExp(token, 'gi');
        const tokenMatches = allItems.match(tokenReg);
        if (tokenMatches) {
          level += tokenMatches.length * token.length;
        }
      });

      if (level > 0) {
        item.level = level;
        matches.push(item);
      }
    });

    matches.sort((a, b) => b.level - a.level);

    return matches.slice(0, 10);
  }

}
