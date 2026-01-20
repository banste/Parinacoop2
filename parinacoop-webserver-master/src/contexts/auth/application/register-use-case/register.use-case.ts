import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { RegisterDto } from '../../infrastructure/dto/register.dto';
import { UserRepository } from '../../domain/user.repository';
import * as bcrypt from 'bcryptjs';
import { User } from '../../domain/user';
import { Role } from '@/contexts/shared/enums/roles.enum';

@Injectable()
export class RegisterUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  private normalizeRunToInteger(runInput: string | number): number {
    if (runInput == null) {
      throw new BadRequestException('RUN vacío');
    }

    let s = String(runInput).trim();

    // Si tiene guión, tomar la parte izquierda (antes del DV)
    if (s.includes('-')) {
      s = s.split('-')[0];
    }

    // Quitar puntos y espacios
    s = s.replace(/[.\s]/g, '');

    // Si termina en K/k (DV), quitarla
    if (/[kK]$/.test(s)) {
      s = s.slice(0, -1);
    }

    // Si queda más de 8 dígitos (posible DV incluido), eliminar último dígito
    const digitsOnly = s.replace(/\D/g, '');
    if (digitsOnly.length > 8) {
      s = digitsOnly.slice(0, -1);
    } else {
      s = digitsOnly;
    }

    if (!/^\d+$/.test(s)) {
      throw new BadRequestException('RUN inválido');
    }

    const n = Number(s);
    if (Number.isNaN(n)) {
      throw new BadRequestException('RUN inválido');
    }

    return n;
  }

  async execute(dto: RegisterDto) {
    // Normalizar run (quitando puntos y DV) -> integer sin DV
    const runNumber = this.normalizeRunToInteger(dto.run);

    // Verificar existencia
    const exists = await this.userRepo.getByRun(runNumber);
    if (exists) {
      throw new ConflictException('Usuario ya existe');
    }

    // Hashear password
    const pwdHash = await bcrypt.hash(dto.password, 10);

    // Obtener communeId: preferir top-level dto.communeId, si no existe tomar dto.address?.communeId
    const addr = dto.address ?? ({} as any);
    const communeFromAddress = addr?.communeId;
    const communeTop = dto.communeId;
    const communeIdCandidate = communeTop ?? communeFromAddress;

    const communeId = communeIdCandidate != null ? Number(communeIdCandidate) : undefined;

    // Normalizar number de address si vino como string
    const addressNumber = addr.number != null ? Number(addr.number) : undefined;

    if (addressNumber !== undefined && Number.isNaN(addressNumber)) {
      throw new BadRequestException('Número de dirección inválido');
    }
    if (communeId !== undefined && Number.isNaN(communeId)) {
      throw new BadRequestException('Comuna inválida');
    }

    // Construir entidad User
    const userEntity = new User({
      run: runNumber,
      role: (Role.CLIENT as any) ?? 'CLIENT',
      password: pwdHash,
      profile: {
        names: dto.names,
        firstLastName: dto.firstLastName,
        secondLastName: dto.secondLastName ?? '',
        email: dto.email,
        cellphone: dto.cellphone,
        documentNumber: dto.documentNumber,
      },
      address: {
        typeAddress: addr.typeAddress ?? 'home',
        street: addr.street ?? '',
        number: addressNumber ?? 0,
        detail: addr.detail ?? '',
        communeId: communeId ?? 0,
      },
    });

    // Delegar creación en el repositorio
    const created = await this.userRepo.create(userEntity);

    return typeof (created as any)?.toValue === 'function' ? (created as any).toValue() : created;
  }
}