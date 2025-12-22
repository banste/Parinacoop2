import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DapDialogDetailsComponent } from './dap-dialog-details.component';

describe('DapDialogDetailsComponent', () => {
  let component: DapDialogDetailsComponent;
  let fixture: ComponentFixture<DapDialogDetailsComponent>;

  const matDialogRefMock = {
    close: jasmine.createSpy('close'),
  };

  const dapServiceMock = {
    downloadSolicitudPdf: jasmine.createSpy('downloadSolicitudPdf'),
    downloadInstructivoPdf: jasmine.createSpy('downloadInstructivoPdf'),
  };

  const dapDataMock: any = {
    id: 11,
    userRun: '12345678-9',
    status: 'PENDING',
    type: 'FIXED',
    currencyType: 'CLP',
    days: 30,
    initialDate: new Date(),
    dueDate: new Date(),
    initialAmount: 10000,
    finalAmount: 14000,
    profit: 4000,
    interestRateInMonth: 0.02,
    interestRateInPeriod: 0.03,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DapDialogDetailsComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dapDataMock },
        { provide: MatDialogRef, useValue: matDialogRefMock },
        // OJO: el componente inyecta DapService por tipo; Angular lo resuelve por token de clase.
        // Si tu DapService es una clase, esta provisión sirve igual:
        { provide: (await import('../../dap.service')).DapService, useValue: dapServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DapDialogDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('close() should close dialog', () => {
    component.close();
    expect(matDialogRefMock.close).toHaveBeenCalled();
  });
});
