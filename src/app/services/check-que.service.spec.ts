import { TestBed } from '@angular/core/testing';

import { CheckQueService } from './check-que.service';

describe('CheckQueService', () => {
  let service: CheckQueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckQueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
