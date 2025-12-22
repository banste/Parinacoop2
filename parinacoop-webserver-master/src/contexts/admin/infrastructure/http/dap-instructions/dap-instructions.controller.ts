import { Body, Controller, Get, Put } from '@nestjs/common';
import { GetDapInstructionsUseCase } from 'src/contexts/admin/application/get-dap-instructions-use-case/get-dap-instructions.use-case';
import { UpdateDapInstructionsUseCase } from 'src/contexts/admin/application/update-dap-instructions-use-case/update-dap-instructions.use-case';
import { UpdateDapInstructionsHttpDto } from './dap-instructions.http-dto';

@Controller('admin/dap-instructions') // ✅ ahora calza con el frontend
export class DapInstructionsAdminController {
  constructor(
    private readonly getUC: GetDapInstructionsUseCase,
    private readonly updateUC: UpdateDapInstructionsUseCase,
  ) {}

  @Get()
  async get() {
    return this.getUC.execute();
  }

  @Put()
  async update(@Body() dto: UpdateDapInstructionsHttpDto) {
    await this.updateUC.execute(dto);
    // ✅ devolvemos lo guardado (frontend hace patchValue con esto)
    return this.getUC.execute();
  }
}
