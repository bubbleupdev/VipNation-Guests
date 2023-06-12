export interface IContentList {
  path: string;
}

export interface IAllContentItem {
  selectedTourDateInstanceId: number|null;
  tourDates: [];
  purchasers: [];
  checkInOutQueue: [];
  log: [];
}

