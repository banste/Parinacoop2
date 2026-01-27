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

  /**
   * list: si q es numérico (solo dígitos) hacemos filtrado por substring sobre run
   * en memoria (string include). Si q NO es numérico, delegamos a repository.findAll(q)
   * para que haga búsqueda por nombre/email/document_number.
   *
   * Esta aproximación garantiza resultados parciales (ej. q=8271 => matchea 827112).
   * Si en el futuro necesitas rendimiento en grandes volúmenes, adaptamos la consulta SQL.
   */
  async list(q?: string): Promise<{ data: User[]; total: number }> {
    const qTrim = String(q ?? '').trim();

    // Si q vacío => devolver todo (delegamos al repo)
    if (qTrim === '') {
      const dataAll = await this.repository.findAll();
      return { data: dataAll, total: Array.isArray(dataAll) ? dataAll.length : 0 };
    }

    // Si q contiene sólo dígitos -> filtrado por RUN parcial (string contains)
    if (/^\d+$/.test(qTrim)) {
      // obtenemos todos (o podríamos optimizar en repo) y filtramos por inclusion
      const all = await this.repository.findAll(); // repo sin filtro
      const filtered = (all ?? []).filter((u) => {
        const runStr = String(u.run ?? '').trim();
        return runStr !== '' && runStr.includes(qTrim);
      });
      return { data: filtered, total: filtered.length };
    }

    // Si q no es numérico, delegamos al repo (búsqueda por nombre/email/document_number)
    const data = await this.repository.findAll(qTrim);
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