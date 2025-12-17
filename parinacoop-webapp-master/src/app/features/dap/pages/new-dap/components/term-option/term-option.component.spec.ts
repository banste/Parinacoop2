import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermOptionComponent } from './term-option.component';

describe('TermOptionComponent', () => {
  let component: TermOptionComponent;
  let fixture: ComponentFixture<TermOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermOptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
