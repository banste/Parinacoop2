import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { User } from '@/contexts/shared/decorators/user.decorator';
import { UserRequest } from '@/utils/interfaces/user-request.interface';
import { DapContractsService } from '../dap-contracts.service';

@ApiTags('DAP Contracts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('clients/:run/daps/:dapId/contracts')
export class DapContractsController {
  constructor(private readonly contractsService: DapContractsService) {}

  @Post()
  async upload(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Body() body: { filename: string; contentBase64: string },
  ) {
    if (Number(user.run) !== run) throw new ForbiddenException();
    const rec = await this.contractsService.uploadContract(run, dapId, body.filename, body.contentBase64);
    return { id: rec.id, filename: rec.filename, created_at: rec.created_at };
  }

  @Get()
  async list(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
  ) {
    if (Number(user.run) !== run) throw new ForbiddenException();
    return this.contractsService.listContracts(run, dapId);
  }

  @Get(':contractId/download')
  async download(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Res() res: Response,
  ) {
    if (Number(user.run) !== run) throw new ForbiddenException();
    const rec = await this.contractsService.getContract(run, dapId, contractId);
    return res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${rec.filename}"`)
      .sendFile(rec.storage_path, { root: '/' } as any);
  }

  @Delete(':contractId')
  async delete(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
  ) {
    if (Number(user.run) !== run) throw new ForbiddenException();
    await this.contractsService.deleteContract(run, dapId, contractId);
    return { ok: true };
  }
}