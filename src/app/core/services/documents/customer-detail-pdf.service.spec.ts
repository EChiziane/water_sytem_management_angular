import { TestBed } from '@angular/core/testing';

import { CustomerDetailPdfService } from './customer-detail-pdf.service';

describe('CustomerDetailPdfService', () => {
  let service: CustomerDetailPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerDetailPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
