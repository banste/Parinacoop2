import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DapRepository } from '../domain/ports/dap.repository';
import { DapContractsRepository } from './repositories/dap-contracts.repository';

@Injectable()
export class DapContractsService {
  private readonly UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'dap');
  private readonly MAX_BYTES_CONTRACT = 10 * 1024 * 1024; // 10 MB

  constructor(
    private readonly dapRepository: DapRepository,
    private readonly contractsRepo: DapContractsRepository,
  ) {}

  private async ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
  }

  private sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9.\-_ ]/g, '_').slice(0, 200);
  }

  private isPdfBuffer(buf: Buffer): boolean {
    return buf.slice(0, 4).toString() === '%PDF';
  }

  async uploadContract(run: number, dapId: number, filename: string, base64: string) {
    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new NotFoundException('DAP no encontrado o no autorizado');

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.byteLength === 0) throw new BadRequestException('Archivo vacío');
    if (buffer.byteLength > this.MAX_BYTES_CONTRACT) throw new BadRequestException('Contrato excede tamaño permitido (10 MB)');
    if (!this.isPdfBuffer(buffer)) throw new BadRequestException('El contrato debe ser PDF');

    const safeName = this.sanitizeFilename(filename);
    const timestamp = Date.now();
    const subdir = path.join(this.UPLOAD_ROOT, String(dapId), 'contracts');
    await this.ensureDir(subdir);

    const storageName = `${timestamp}-${safeName}`;
    const storagePath = path.join(subdir, storageName);

    await fs.writeFile(storagePath, buffer, { mode: 0o600 });

    const record = await this.contractsRepo.create({
      dap_id: dapId,
      filename,
      storage_path: storagePath,
      uploaded_by_run: run,
    });

    return record;
  }

  async listContracts(run: number, dapId: number) {
    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new NotFoundException('DAP no encontrado o no autorizado');

    return this.contractsRepo.findByDap(dapId);
  }

  async getContract(run: number, dapId: number, contractId: number) {
    const rec = await this.contractsRepo.findById(contractId);
    if (!rec) throw new NotFoundException('Contrato no encontrado');
    if (rec.dap_id !== dapId) throw new NotFoundException('Contrato no pertenece a este DAP');

    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new ForbiddenException('No autorizado');

    return rec;
  }

  async deleteContract(run: number, dapId: number, contractId: number) {
    const rec = await this.contractsRepo.findById(contractId);
    if (!rec) throw new NotFoundException('Contrato no encontrado');
    if (rec.dap_id !== dapId) throw new NotFoundException('Contrato no pertenece a este DAP');

    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new ForbiddenException('No autorizado');

    await fs.unlink(rec.storage_path).catch(() => {});
    await this.contractsRepo.deleteById(contractId);
  }
}