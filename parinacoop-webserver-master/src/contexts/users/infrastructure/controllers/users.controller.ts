import { Body, Controller, Delete, Get, Param, Put, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserApplicationService } from '../../application/services/user-application.service';
// Local minimal DTO to avoid missing-module errors when the external DTO file
// is not available. Keep as a class so Nest's ValidationPipe can operate.
class UpdateUserDto {
  [key: string]: any;
}

@Controller('admin/users')
export class UsersController {
  constructor(private readonly appService: UserApplicationService) {}

  @Get()
  async list(@Query('q') q?: string) {
    return this.appService.list(q);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.appService.get(Number(id));
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.appService.update(Number(id), dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.appService.remove(Number(id));
    return { ok: true };
  }
}