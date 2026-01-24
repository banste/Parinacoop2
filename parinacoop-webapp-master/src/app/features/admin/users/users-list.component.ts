import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminUsersService } from './admin-users.service';
import { AdminUser } from './user.model';

@Component({
  selector: 'app-admin-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './users-list.component.html',
})
export default class UsersListComponent implements OnInit {
  users: AdminUser[] = [];
  q = '';
  loading = false;
  error = '';

  constructor(private svc: AdminUsersService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.svc.list({ q: this.q }).subscribe({
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

  onSearch(): void {
    this.load();
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
      next: () => this.load(),
      error: (err) => {
        console.error('delete user error', err);
        alert('Error al eliminar usuario');
      },
    });
  }
}