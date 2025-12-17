import { CreateDapUseCase } from '@/contexts/dap/application/create-dap/create-dap.use-case';
import { PrimitiveDap } from '@/contexts/dap/domain/models/Dap';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateDapHttpDto } from './create-dap.http-dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';

@ApiTags('DAP de clientes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('dap')
export class CreateDapController {
  constructor(private createDapUseCase: CreateDapUseCase) {}

  @Post()
  async run(@Body() httpDto: CreateDapHttpDto): Promise<{ dap: PrimitiveDap }> {
    return await this.createDapUseCase.execute(httpDto);
  }
}
