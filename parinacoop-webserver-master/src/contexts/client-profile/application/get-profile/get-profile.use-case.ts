import { Injectable } from '@/contexts/shared/dependency-injection/injectable';

import { ClientRepository } from '../../domain/ports/client.repository';
import { PrimitiveClient } from '../../domain/models/Client';
import { GetProfileDto } from './get-profile.dto';
import { ClientNotFoundError } from '../../domain/client-not-found.exception';

@Injectable()
export class GetProfileUseCase {
  constructor(private clientRepository: ClientRepository) {}

  async execute(dto: GetProfileDto): Promise<{ profile: PrimitiveClient }> {
    const client = await this.clientRepository.getProfileByRun(dto.run);

    if (!client) {
      throw new ClientNotFoundError(dto.run);
    }

    return { profile: client.toValue() };
  }
}
