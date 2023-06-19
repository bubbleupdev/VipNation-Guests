import { TestBed } from '@angular/core/testing';

import { SafeGraphqlService } from './safe-graphql.service';

describe('SafeGraphqlService', () => {
  let service: SafeGraphqlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SafeGraphqlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
