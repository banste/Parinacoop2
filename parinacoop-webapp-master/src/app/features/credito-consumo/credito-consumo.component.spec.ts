import { ComponentFixture, TestBed } from '@angular/core/testing';

import CreditoConsumoComponent from './credito-consumo.component';

describe('CreditoConsumoComponent', () => {
  let component: CreditoConsumoComponent;
  let fixture: ComponentFixture<CreditoConsumoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditoConsumoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreditoConsumoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
