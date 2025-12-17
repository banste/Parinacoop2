import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TermOption } from '../../models/TermOption';
import { CurrencyPipe, DatePipe, NgClass, PercentPipe } from '@angular/common';

@Component({
  selector: 'app-term-option',
  standalone: true,
  imports: [NgClass, PercentPipe, CurrencyPipe, DatePipe],
  templateUrl: './term-option.component.html',
  styleUrl: './term-option.component.scss',
})
export class TermOptionComponent {
  @Input({ required: true }) termOption!: TermOption;
  @Input() selected = false;
  @Output() emitTermOption = new EventEmitter<TermOption>();
}
