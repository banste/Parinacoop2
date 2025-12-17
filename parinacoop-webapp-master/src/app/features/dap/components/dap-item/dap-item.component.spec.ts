import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DapItemComponent } from './dap-item.component';

describe('DapItemComponent', () => {
  let component: DapItemComponent;
  let fixture: ComponentFixture<DapItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DapItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DapItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
