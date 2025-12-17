import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { UserRepository } from '../../domain/ports/user.repository';
import { CreateClientDto } from './create-client.dto';
import { deconstructRut } from '@fdograph/rut-utilities';
import { TPrimitiveUser, User } from '../../domain/models/User';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { Address } from '../../domain/models/Address';
import { Profile } from '../../domain/models/Profile';
import { HashingService } from '@/contexts/shared/providers';
import { UserClientExistsException } from '../../domain/exceptions/user-client-exists.exception';

@Injectable()
export class CreateClientUseCase {
  constructor(
    private hashingService: HashingService,
    private userClientRepository: UserRepository,
  ) {}

  async execute(dto: CreateClientDto): Promise<{ userclient: TPrimitiveUser }> {
    const { digits } = deconstructRut(dto.run);
    const userClientExists = await this.userClientRepository.getByRun(+digits);
    if (userClientExists) {
      throw new UserClientExistsException();
    }

    const newUserClient = User.create({
      run: +digits,
      role: Role.CLIENT,
      password: await this.hashingService.hash(dto.password),
      address: Address.create({
        typeAddress: dto.typeAddress,
        street: dto.street,
        number: dto.number,
        detail: dto.detail,
        communeId: dto.communeId,
      }),
      profile: Profile.create({
        names: dto.names,
        firstLastName: dto.firstLastName,
        secondLastName: dto.secondLastName,
        documentNumber: dto.documentNumber,
        email: dto.email,
        cellphone: dto.cellphone,
      }),
    });
    const result = await this.userClientRepository.create(newUserClient);
    return { userclient: result.toValue() };
  }
}
