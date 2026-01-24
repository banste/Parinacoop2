import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-repository.interface';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];
  private nextId = 1;

  // constructor limpio (sin seed)
  constructor() {
    // no seed — la lista inicial será vacía
    this.users = [];
  }

  async findAll(q?: string): Promise<User[]> {
    if (!q) return [...this.users];
    const lower = q.toLowerCase();
    return this.users.filter((u) =>
      String(u.name ?? '').toLowerCase().includes(lower) ||
      String(u.email ?? '').toLowerCase().includes(lower) ||
      String(u.run ?? '').includes(lower),
    );
  }

  async findOne(id: number): Promise<User | null> {
    return this.users.find((x) => x.id === id) ?? null;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const idx = this.users.findIndex((x) => x.id === id);
    if (idx === -1) {
      throw new Error('User not found');
    }
    const updated: User = {
      ...this.users[idx],
      ...data,
      id: this.users[idx].id,
      updatedAt: new Date().toISOString(),
    };
    this.users[idx] = updated;
    return updated;
  }

  async remove(id: number): Promise<void> {
    const idx = this.users.findIndex((x) => x.id === id);
    if (idx === -1) {
      throw new Error('User not found');
    }
    this.users.splice(idx, 1);
  }
}