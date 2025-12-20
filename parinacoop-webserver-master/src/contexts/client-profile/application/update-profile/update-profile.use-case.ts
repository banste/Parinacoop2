import { Injectable } from '../../../shared/dependency-injection/injectable';
import { ClientRepository } from '../../domain/ports/client.repository';
import { UpdateProfileDto } from './update-profile.dto';
import { Client } from '../../domain/models/Client';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(
    run: number,
    dto: UpdateProfileDto,
  ): Promise<{ msg: string }> {

    // Seguridad básica
    if (!run || isNaN(run)) {
      throw new Error('RUN inválido');
    }

    const clientProfile = new Client({
      run,
      documentNumber: dto.documentNumber,
      names: dto.names,
      firstLastName: dto.firstLastName,
      secondLastName: dto.secondLastName,
      email: dto.email,
      cellphone: dto.cellphone,
      street: dto.street,
      number: dto.number,
      detail: dto.detail,
      regionId: dto.regionId,
      communeId: dto.communeId,
    });

    await this.clientRepository.updateProfile(clientProfile);

    return {
      msg: 'Perfil actualizado correctamente',
    };
  }
}
