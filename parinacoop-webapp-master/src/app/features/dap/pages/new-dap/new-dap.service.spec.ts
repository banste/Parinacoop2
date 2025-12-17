import { TestBed } from '@angular/core/testing';

import { NewDapService } from './new-dap.service';

describe('NewDapService', () => {
  let service: NewDapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NewDapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
