import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { SimulateDapUseCase } from '@/contexts/dap/application';
import { PrimitiveSDap } from '@/contexts/dap/domain/models/SDap';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';

import { SimulateDapHttpDto } from './simulate-dap.http-dto';

@ApiTags('DAP de clientes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('dap')
export class SimulateDapController {
  constructor(private simulateDapUseCase: SimulateDapUseCase) {}

  @HttpCode(HttpStatus.OK)
  @Post('simulate')
  async run(
    @Body() httpDto: SimulateDapHttpDto,
  ): Promise<{ sDaps: PrimitiveSDap[] }> {
    return await this.simulateDapUseCase.run(httpDto);
  }
}
