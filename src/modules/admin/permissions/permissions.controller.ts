import { Controller, Get, Param } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Auth, Module, Permission } from '../auth/decorators';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('Admin Permissions')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Auth()
@Module('PRM')
@Controller({
  path: 'permissions',
  version: '1'
})
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Recupera todos los permisos.
   * @returns Una promesa que se resuelve con una serie de todos los permisos.
   */
  @Get()
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtenga todos los permisos' })
  @ApiOkResponse({ description: 'Devolver todos los permisos' })
  findAll() {
    return this.permissionsService.findAll();
  }

  /**
   * Recupera un permiso por su ID.
   * @param id El ID del permiso a recuperar.
   * @returns Una promesa que se resuelve con los datos del permiso.
   */
  @Get(':id')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtenga un permiso' })
  @ApiParam({ name: 'id', description: 'ID del permiso' })
  @ApiOkResponse({ description: 'Devolver un permiso' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }
}
