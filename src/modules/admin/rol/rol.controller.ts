import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { HttpResponse, Rol, RolModulesPermissions, RolPermissions, UserData } from 'src/interfaces';
import { Auth, GetUser, Module, Permission } from '../auth/decorators';
import { CreateRolDto } from './dto/create-rol.dto';
import { DeleteRolesDto } from './dto/delete-roles.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { RolService } from './rol.service';

@ApiTags('Admin Roles')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Controller({ path: 'rol', version: '1' })
@Auth()
export class RolController {
  constructor(private readonly rolService: RolService) {}

  /**
   * Maneja la solicitud de publicación HTTP para crear un nuevo rol.
   * @param createRolDto - El objeto de transferencia de datos que contiene detalles sobre el rol que se creará.
   * @returns Una promesa que se resuelve a la respuesta HTTP que contiene el papel creado.
   */
  @Post()
  @Module('ROL')
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiCreatedResponse({ description: 'Rol creado' })
  @ApiBadRequestResponse({ description: 'Error al crear el rol' })
  create(@Body() createRolDto: CreateRolDto): Promise<HttpResponse<Rol>> {
    return this.rolService.create(createRolDto);
  }

  /**
   * Actualiza un rol existente en la base de datos.
   * @param id Identificador del rol a actualizar.
   * @param updateRolDto - El objeto de transferencia de datos que contiene detalles sobre el rol que se actualizará.
   * @returns Una promesa que se resuelve a la respuesta HTTP que contiene el papel actualizado.
   */
  @Patch(':id')
  @Module('ROL')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiOkResponse({ description: 'ROL actualizado' })
  @ApiBadRequestResponse({ description: 'No hay datos para actualizar' })
  update(
    @Param('id') id: string,
    @Body() updateRolDto: UpdateRolDto
  ): Promise<HttpResponse<RolPermissions>> {
    return this.rolService.update(id, updateRolDto);
  }

  /**
   * Recupera todos los roles con sus módulos y permisos asociados.
   * @param user - El usuario solicita los roles, utilizado para determinar si tiene privilegios de super administrador.
   * @returns Una promesa que resuelve una lista de roles con módulos y permisos.
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles' })
  @ApiBadRequestResponse({ description: 'Roles no encontrado' })
  @ApiOkResponse({ description: 'Roles encontrados' })
  findAll(@GetUser() user: UserData): Promise<RolPermissions[]> {
    return this.rolService.findAll(user);
  }

  /**
   * Elimina un rol por su id.
   * @param id Identificador del rol a eliminar.
   * @returns Una promesa que se resuelve a la respuesta HTTP que contiene el rol eliminado.
   */
  @Delete(':id')
  @Module('ROL')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar un rol' })
  @ApiBadRequestResponse({ description: 'Rol no encontrado' })
  @ApiOkResponse({ description: 'Rol eliminado' })
  remove(@Param('id') id: string): Promise<HttpResponse<Rol>> {
    return this.rolService.remove(id);
  }

  /**
   * Elimina todos los roles de un arreglo
   * @param roles Arreglo de roles a eliminar
   * @param user Usuario que elimina los roles
   * @returns Retorna un mensaje de la eliminación correcta
   */
  @Delete('remove/all')
  @Module('ROL')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar todos los roles' })
  @ApiBadRequestResponse({ description: 'Roles no encontrado' })
  @ApiOkResponse({ description: 'Rols eliminados' })
  removeAll(
    @Body() roles: DeleteRolesDto,
    @GetUser() user: UserData
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.rolService.removeAll(roles, user);
  }

  /**
   * Reactiva todos los roles proporcionados en la matriz.
   * @param roles - Variedad de roles para ser reactivados.
   * @param user - El usuario realiza la reactivación.
   * @returns Una promesa que se resuelve a una respuesta HTTP sin datos.
   */
  @Patch('reactivate/all')
  @Module('ROL')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Reactivar todos los roles' })
  @ApiBadRequestResponse({ description: 'Rols no encontrado' })
  @ApiOkResponse({ description: 'Rols reactivados' })
  reactivateAll(
    @Body() roles: DeleteRolesDto,
    @GetUser() user: UserData
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.rolService.reactivateAll(roles, user);
  }

  /**
   * Encuentra un rol por su id y devuelve los datos del rol con módulos y permisos.
   * @param id - Identificador del rol a buscar.
   * @returns Una promesa que se resuelve a los datos del rol encontrado con módulos y permisos agrupados.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol' })
  @ApiBadRequestResponse({ description: 'Rol no encontrado' })
  @ApiOkResponse({ description: 'Rol encontrado' })
  findOne(@Param('id') id: string): Promise<RolPermissions> {
    return this.rolService.findById(id);
  }

  /**
   * Mostrar todos los módulos con sus permisos
   * @returns Una lista de módulos con sus permisos
   */
  @Get('modules-permissions/all')
  @ApiOperation({ summary: 'Obtener todos los módulos con sus permisos' })
  @ApiBadRequestResponse({ description: 'Módulos no encontrados' })
  @ApiOkResponse({ description: 'Módulos encontrados' })
  findAllModulesPermissions(): Promise<RolModulesPermissions[]> {
    return this.rolService.findAllModulesPermissions();
  }
}
