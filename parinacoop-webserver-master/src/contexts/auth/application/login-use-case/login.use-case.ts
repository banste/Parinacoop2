import { JwtService } from '@nestjs/jwt';
import { HashingService } from '@/contexts/shared/providers/hashing.service';

import { UserRepository } from '@/contexts/auth/domain/user.repository';
import { InvalidCredentialsException } from '@/contexts/auth/domain/invalid-credentials.exception';

import { LoginDto } from './login.dto';
import { Injectable } from '@/contexts/shared/dependency-injection/injectable';

/**
 * Convierte:
 *  - "20.218.321-2" -> 20218321
 *  - "20218321-2"   -> 20218321
 *  - 20218321       -> 20218321
 */
function rutToRunNumber(rutLike: unknown): number {
  // Caso: ya viene como número
  if (typeof rutLike === 'number') {
    return rutLike;
  }

  // Caso: viene como string u otro
  const rut = String(rutLike ?? '');

  // Limpia puntos y guiones
  const clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();

  // Quita dígito verificador si existe
  const runPart = clean.length > 1 ? clean.slice(0, -1) : clean;

  return Number(runPart);
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<{ accessToken: string }> {
    // 🔹 Convertir RUT a RUN numérico
    const runNumber = rutToRunNumber(dto.run);

    if (Number.isNaN(runNumber)) {
      throw new InvalidCredentialsException();
    }

    // 🔹 Buscar usuario
    const user = await this.userRepository.getByRun(runNumber);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    // 🔹 Validar password
    const { run, role, password } = user.toValue();

    // Manejo seguro: si no existe password en la entidad, consideramos credenciales inválidas
    if (!password) {
      throw new InvalidCredentialsException();
    }

    const isSamePassword = await this.hashingService.compare(
      dto.password,
      password.toString(),
    );

    if (!isSamePassword) {
      throw new InvalidCredentialsException();
    }

    // 🔹 Generar JWT
    return {
      accessToken: await this.jwtService.signAsync({ run, role }),
    };
  }
}