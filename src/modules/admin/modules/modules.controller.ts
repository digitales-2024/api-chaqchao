import { Controller, Get, Param } from '@nestjs/common';
import { ModulesService } from './modules.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators';

@ApiTags('Admin Modules')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Auth()
@Controller({
  path: 'modules',
  version: '1'
})
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  /**
   * Visualiza todos los m&oacute;dulos registrados en la base de datos
   * @returns Los m&oacute;dulos registrados en la base de datos
   */
  @Get()
  @ApiOperation({ summary: 'Visualiza todos los módulos registrados en la base de datos' })
  @ApiOkResponse({ description: 'Devolver todos los módulos' })
  findAll() {
    return this.modulesService.findAll();
  }

  /**
   * Visualiza un módulo en específico por su id
   * @param id Id del módulo a buscar
   * @returns Datos del módulo encontrado
   */
  @Get(':id')
  @ApiOperation({ summary: 'Visualiza un módulo en específico por su id' })
  @ApiParam({ name: 'id', description: 'Id del módulo a buscar' })
  @ApiOkResponse({ description: 'Devolver un módulo' })
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }
}
