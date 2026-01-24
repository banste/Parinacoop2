import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user-repository.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UserApplicationService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: UserRepository,
  ) {}

  async list(q?: string): Promise<{ data: User[]; total: number }> {
    const data = await this.repository.findAll(q);
    return { data, total: Array.isArray(data) ? data.length : 0 };
  }

  async get(id: number): Promise<User> {
    const user = await this.repository.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const updated = await this.repository.update(id, dto as Partial<User>);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: number): Promise<void> {
    return this.repository.remove(id);
  }
}