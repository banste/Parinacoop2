import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDapComponent } from './new-dap.component';

describe('NewDapComponent', () => {
  let component: NewDapComponent;
  let fixture: ComponentFixture<NewDapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewDapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewDapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
