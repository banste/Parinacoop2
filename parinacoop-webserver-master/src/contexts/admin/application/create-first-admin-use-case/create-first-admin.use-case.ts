import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { UserRepository } from '../../domain/ports/user.repository';
import { TPrimitiveUser, User } from '../../domain/models/User';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { AdminExistsException } from '../../domain/exceptions/admin-exists.exception';
import { CreateFirstAdminDto } from './create-first-admin.dto';
import { HashingService } from '@/contexts/shared/providers';
import { deconstructRut } from '@fdograph/rut-utilities';

@Injectable()
export class CreateFirstAdminUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashingService: HashingService,
  ) {}

  async execute(dto: CreateFirstAdminDto): Promise<{ admin: TPrimitiveUser }> {
    const admins = await this.userRepository.getByRole(Role.ADMIN);

    if (admins.length > 0) {
      throw new AdminExistsException();
    }

    const { digits } = deconstructRut(dto.run);

    const newAdmin = User.create({
      run: +digits,
      role: Role.ADMIN,
      password: await this.hashingService.hash(dto.password),
    });

    const result = await this.userRepository.create(newAdmin);

    return {
      admin: result.toValue(),
    };
  }
}
