import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgIconComponent } from '@app/shared/components';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  mail: string = 'cooperativa@parinacoop.cl';
  cellphone: string = '+56 9 3238 2725';
  addresses: string[] = [
    'Bolognesi N° 345, Arica',
    'Thompson 127 oficina 608, Iquique',
  ];
}