import { Component, Input, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Lista de iconos admitidos. Añade nombres si los usas en plantillas.
 */
export type SVGIcon =
  | 'marker'
  | 'WhatsApp'
  | 'mail'
  | 'logout'
  | 'plus'
  | 'back'
  | 'save'
  | 'pencil'
  | 'trash'
  | 'user'; // <-- agregado 'user'

@Component({
  selector: 'app-svg-icon',
  standalone: true,
  imports: [CommonModule], // <- necesario para ngSwitch / ngSwitchCase / ngSwitchDefault
  templateUrl: './svg-icon.component.html',
})
export class SvgIconComponent implements AfterViewInit {
  @Input({ required: true }) icon!: SVGIcon;

  /**
   * Clase opcional expresada explícitamente (svgClass),
   * además se recogerán las clases puestas en el host (<app-svg-icon class="...">)
   * y se concatenarán en svgClassFinal para aplicar al <svg>.
   */
  @Input() svgClass?: string;

  svgClassFinal = '';

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    const hostClass = (this.el.nativeElement as HTMLElement).className ?? '';
    this.svgClassFinal = [this.svgClass, hostClass].filter(Boolean).join(' ').trim();
    // Forzamos detección porque cambiamos un binding después de la fase inicial de render
    this.cdr.detectChanges();
  }
}