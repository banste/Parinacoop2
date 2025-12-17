import { ComponentFixture, TestBed } from '@angular/core/testing';

import CreditoComercialComponent from './credito-comercial.component';

describe('CreditoComercialComponent', () => {
  let component: CreditoComercialComponent;
  let fixture: ComponentFixture<CreditoComercialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditoComercialComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreditoComercialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
