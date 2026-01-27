import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminUsersService } from './admin-users.service';
import { AdminUser } from './user.model';
import { SvgIconComponent } from '@app/shared/components';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-admin-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SvgIconComponent],
  templateUrl: './users-list.component.html',
})
export default class UsersListComponent implements OnInit, OnDestroy {
  users: AdminUser[] = [];
  q = '';
  loading = false;
  error = '';

  private search$ = new Subject<string>();
  private subs: Subscription | null = null;

  constructor(private svc: AdminUsersService, private router: Router) {}

  ngOnInit(): void {
    // búsqueda en vivo (debounce)
    this.subs = this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((val) => {
        const digits = this.sanitizeQ(val);
        this.load(digits);
      });

    // carga inicial
    this.load();
  }

  ngOnDestroy(): void {
    this.subs?.unsubscribe();
  }

  load(qParam?: string): void {
    this.loading = true;
    this.error = '';

    const params: { q?: string } = {};
    if (qParam !== undefined) params.q = qParam;

    this.svc.list(params).subscribe({
      next: (res) => {
        this.users = res.data ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('list users error', err);
        this.error = 'Error cargando usuarios';
        this.loading = false;
      },
    });
  }

  onInput(value: string): void {
    this.q = value;
    this.search$.next(value);
  }

  sanitizeQ(raw?: string): string | undefined {
    const s = String(raw ?? '').replace(/\D/g, '').trim();
    return s === '' ? undefined : s;
  }

  onManualSearch(): void {
    this.load(this.sanitizeQ(this.q));
  }

  goCreate(): void {
    this.router.navigate(['admin', 'usuarios', 'nuevo']);
  }

  edit(user: AdminUser): void {
    this.router.navigate(['admin', 'usuarios', String(user.id), 'editar']);
  }

  remove(user: AdminUser): void {
    if (!confirm(`¿Eliminar usuario ${user.name ?? user.id}?`)) return;
    this.svc.delete(user.id).subscribe({
      next: () => this.load(this.sanitizeQ(this.q)),
      error: (err) => {
        console.error('delete user error', err);
        alert('Error al eliminar usuario');
      },
    });
  }

  // Navegar a la página de DAPs del usuario
  goToDaps(user: AdminUser): void {
    if (!user || !user.id) return;
    this.router.navigate(['admin', 'usuarios', String(user.id), 'daps']);
  }
}