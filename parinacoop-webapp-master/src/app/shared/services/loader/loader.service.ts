import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private loading: boolean = false;

  constructor() {}

  // API existente
  setLoading(loading: boolean) {
    this.loading = loading;
  }

  getLoading(): boolean {
    return this.loading;
  }

  // Métodos convenientes (show/hide) para evitar castear en consumidores
  show(): void {
    this.setLoading(true);
  }

  hide(): void {
    this.setLoading(false);
  }
}