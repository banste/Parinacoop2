import { JwtService } from '@nestjs/jwt';
import { HashingService } from '@/contexts/shared/providers/hashing.service';

import { UserRepository } from '@/contexts/auth/domain/user.repository';
import { InvalidCredentialsException } from '@/contexts/auth/domain/invalid-credentials.exception';

import { LoginDto } from './login.dto';
import { Injectable } from '@/contexts/shared/dependency-injection/injectable';

@Injectable()
export class LoginUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashingService: HashingService,
    private jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userRepository.getByRun(dto.run);

    if (!user) {
      throw new InvalidCredentialsException();
    }
    // console.log(await this.hashingService.hash(dto.password));

    const { run, role, password } = user.toValue();

    // Manejo seguro: si no existe password en la entidad, consideramos credenciales inválidas
    if (!password) {
      throw new InvalidCredentialsException();
    }

    const isSamePassword = await this.hashingService.compare(
      dto.password ?? '',
      password.toString(),
    );
    if (!isSamePassword) {
      throw new InvalidCredentialsException();
    }

    return {
      accessToken: await this.jwtService.signAsync({ run, role }),
    };
  }
}