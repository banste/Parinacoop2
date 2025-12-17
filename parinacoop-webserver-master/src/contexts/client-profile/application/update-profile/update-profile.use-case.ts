import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { ClientRepository } from '../../domain/ports/client.repository';
import { UpdateProfileDto } from './update-profile.dto';
import { Client } from '../../domain/models/Client';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private clientRepository: ClientRepository) {}

  async execute(dto: UpdateProfileDto): Promise<{ msg: string }> {
    const clientProfile = new Client(dto);

    await this.clientRepository.updateProfile(clientProfile);

    return { msg: 'Perfil actualizado correctamente' };
  }
}
