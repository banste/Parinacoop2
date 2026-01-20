import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[groupEvery3]',
  standalone: true,
})
export class GroupEvery3Directive {
  private prevValue = '';

  constructor(private el: ElementRef<HTMLInputElement>) {}

  private formatRaw(raw: string): string {
    if (!raw) return '';
    // quitar puntos existentes
    const r = raw.replace(/\./g, '');
    // insertar punto cada 3 caracteres desde el inicio
    return r.replace(/(.{3})/g, '$1.').replace(/\.$/, '');
  }

  @HostListener('input', ['$event'])
  onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const rawBefore = this.prevValue.replace(/\./g, '');
    const cursorBefore = input.selectionStart ?? input.value.length;

    // calcular cursor position en raw (sin puntos)
    const dotsBefore = (this.prevValue.slice(0, cursorBefore).match(/\./g) || []).length;
    const rawCursor = cursorBefore - dotsBefore;

    // nuevo valor sin puntos (puede venir por tecla/paste)
    const newRaw = input.value.replace(/\./g, '');

    // formatear
    const formatted = this.formatRaw(newRaw);

    // establecer valor formateado en el input (si cambió)
    if (formatted !== input.value) {
      input.value = formatted;
    }

    // calcular nueva posición del cursor basada en rawCursor
    // número de puntos antes de rawCursor en el nuevo valor:
    const dotsBeforeNew = Math.floor(rawCursor / 3);
    let newCursorPos = rawCursor + dotsBeforeNew;

    // edge cases: no pasarse del largo
    if (newCursorPos > formatted.length) newCursorPos = formatted.length;

    // restaurar selección
    input.setSelectionRange(newCursorPos, newCursorPos);

    this.prevValue = formatted;
    // disparar evento input manualmente si necesitas que angular reactiveForms detecte el cambio
    const ev = new Event('input', { bubbles: true });
    input.dispatchEvent(ev);
  }

  // por si usamos programáticamente setValue desde un FormControl y queremos inicializar prevValue
  public setInitial(value: string) {
    this.prevValue = value ?? '';
    const input = this.el.nativeElement;
    input.value = this.formatRaw(this.prevValue);
  }
}