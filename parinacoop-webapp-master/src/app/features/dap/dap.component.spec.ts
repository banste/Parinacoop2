import { ComponentFixture, TestBed } from '@angular/core/testing';

import DapComponent from './dap.component';

describe('DapComponent', () => {
  let component: DapComponent;
  let fixture: ComponentFixture<DapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
