import { Injectable } from '@angular/core';
import {IGuests} from "../interfaces/guest";
import {IEvents} from "../interfaces/page";
import {ITourDates} from "../interfaces/tourDate";
import {IUserItem} from "../interfaces/user";
import {normalize} from "../helpers/data.helper";

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

  /**
   *
   * @param events
   * @param count
   * @param ignoreFavorites
   */
  public getFutureEvents(events: ITourDates, count: number = 10) {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const cnt = count>0 ? count-1: 9;

    let futureEvents = events
      .filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= oneWeekAgo && event.isFavorite;
      });

    if (futureEvents.length === 0) {
      futureEvents = events
        .filter(event => {
          const eventDate = new Date(event.eventDate);
          return eventDate >= oneWeekAgo;
        });
    }

    futureEvents = futureEvents.sort((a, b) => {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        return dateA.getTime() - dateB.getTime();
      });

    return futureEvents.slice(0, cnt);
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

  public searchInGuests(query:string, guests: IGuests) {
    const tokens = this.tokenizer(query);
    let items = [];
    if (guests) {

      guests.forEach((guest) => {
        const data = [normalize(guest.firstName), normalize(guest.lastName), guest.email, guest.phone];

        if (!guest.sameAsMain || !guest.email) {
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
            data: data,
            strs: []
          };
          items.push(item);
        }
      });
    }

    const foundGuests = this.searchInG(tokens, items, query.length, query);
    return foundGuests.map(foundGuest => foundGuest.item);
  }


  protected tokenizer(query: string) {
    const tokens: string[] = [];

    tokens.push(query);

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

  protected searchInG(tokens: string[], items: any[], partialCount = 3, str: string = '') {

    // const exactMatches = [];
    //
    // for (const item of items) {
    //   const dataValues = item.data.map(val => (val || '').toString().toLowerCase());
    //   let exactCount = 0;
    //
    //   tokens.forEach(token => {
    //     if (token.length>0) {
    //       if (dataValues.includes(token.toLowerCase())) {
    //         exactCount++;
    //       }
    //     }
    //   });
    //
    //   if (exactCount > 0) {
    //     item.exactMatchesCount = exactCount;
    //     exactMatches.push(item);
    //   }
    // }
    //
    // if (exactMatches.length > 0) {
    //   exactMatches.sort((a, b) => b.exactMatchesCount - a.exactMatchesCount);
    //   return exactMatches;
    // }

    const partialMatches = [];

    for (const item of items) {
      const dataValues = item.data.map(val => (val || '').toString().toLowerCase());
      let matchCount = 0;

      if (str.length>0) {
        if (dataValues.some(val => val.startsWith(str))) {
          matchCount++;
        }
      }
      else {
        tokens.forEach(token => {
          const partialToken = token.slice(0, partialCount).toLowerCase();
          if (partialToken.length > 0) {
            if (dataValues.some(val => val.startsWith(partialToken))) {
              matchCount++;
            }
          }
        });
      }

      if (matchCount > 0) {
        item.partialMatchCount = matchCount;
        partialMatches.push(item);
      }
    }

    if (partialMatches.length > 0) {
      partialMatches.sort((a, b) => b.partialMatchCount - a.partialMatchCount);
      return partialMatches;
    }

    // fallback — common search


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

    return matches;
//    return matches.slice(0, 10);
  }


  protected searchIn(tokens: string[], items: any[], partialCount = 3, str: string = '') {

    const exactMatches = [];

    for (const item of items) {
      const dataValues = item.data.map(val => (val || '').toString().toLowerCase());
      let exactCount = 0;

      tokens.forEach(token => {
        if (token.length>0) {
          if (dataValues.includes(token.toLowerCase())) {
            exactCount++;
          }
        }
      });

      if (exactCount > 0) {
        item.exactMatchesCount = exactCount;
        exactMatches.push(item);
      }
    }

    if (exactMatches.length > 0) {
      exactMatches.sort((a, b) => b.exactMatchesCount - a.exactMatchesCount);
      return exactMatches;
    }

    // fallback — common search


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

    return matches;
//    return matches.slice(0, 10);
  }

}
