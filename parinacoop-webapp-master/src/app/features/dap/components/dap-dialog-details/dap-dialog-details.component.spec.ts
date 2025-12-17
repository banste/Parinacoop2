import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DapDialogDetailsComponent } from './dap-dialog-details.component';

describe('DapDetailsComponent', () => {
  let component: DapDialogDetailsComponent;
  let fixture: ComponentFixture<DapDialogDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DapDialogDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DapDialogDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
