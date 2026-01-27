import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { UserApplicationService } from '../../application/services/user-application.service';

@Controller('admin/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly appService: UserApplicationService) {}

  @Get()
  async list(@Query('q') q?: string) {
    // Log de depuración para confirmar que el backend recibe el parámetro q
    this.logger.debug(`[DEBUG UsersController] GET /admin/users q=${String(q ?? '')}`);
    return this.appService.list(q);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.appService.get(Number(id));
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() dto: any) {
    // Not implemented in application service by default — guardamos la llamada para implementar si lo necesitas
    this.logger.debug(`[UsersController] create dto=${JSON.stringify(dto)}`);
    throw new NotImplementedException('Create user not implemented in application service.');
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(@Param('id') id: string, @Body() dto: any) {
    // En producción evitamos logs masivos; si necesitas auditoría habilita logging condicional
    return this.appService.update(Number(id), dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.appService.remove(Number(id));
  }
}