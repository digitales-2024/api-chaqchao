import { Controller, Get, Patch, Param, Body, Query, Res } from '@nestjs/common';
import { ClientAdminService } from './client-admin.service';
import { UpdateClientDto } from '../../shop/client/dto/update-client.dto';
import {
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser, Module, Permission } from '../auth/decorators';
import { ClientPayload, UserData } from 'src/interfaces';
import { Response } from 'express';
import { ClientFilterDto } from './dto/client-filter.dto';

@ApiTags('Admin Clients')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Auth()
@Module('CST')
@Controller({
  path: 'admin/client',
  version: '1'
})
export class ClientAdminController {
  constructor(private readonly clientAdminService: ClientAdminService) {}

  /**
   * Consigue todas las clientas
   * @returns Todas las clientas
   */
  @Get()
  @Permission(['READ'])
  @ApiOperation({ summary: 'Mostrar todas los clientes' })
  @ApiOkResponse({ description: 'Clientes encontrados' })
  findAll(): Promise<ClientPayload[]> {
    return this.clientAdminService.findAll();
  }

  /**
   * Actualiza un cliente por su ID
   * @param id ID del cliente a actualizar
   * @param UpdateClientDto Datos para actualizar el cliente
   * @param user Usuario que realiza la actualización
   * @returns El cliente actualizado
   */
  @Patch(':id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiOkResponse({ description: 'Cliente actualizado' })
  @ApiBody({ type: UpdateClientDto, description: 'Datos para actualizar el cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente a actualizar' })
  update(
    @Param('id') id: string,
    @Body() UpdateClientDto: UpdateClientDto,
    @GetUser() user: UserData
  ): Promise<ClientPayload> {
    return this.clientAdminService.update(id, UpdateClientDto, user);
  }

  /**
   * Reactiva un cliente por su ID
   * @param id ID del cliente a reactivar
   * @param user Usuario que reactiva el cliente
   * @returns El cliente reactivado
   */
  @Patch('desactivate/:id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Desactivar cliente' })
  @ApiOkResponse({ description: 'Cliente desactivado' })
  @ApiParam({ name: 'id', description: 'ID del cliente a desactivar' })
  reactivate(@Param('id') id: string, @GetUser() user: UserData): Promise<ClientPayload> {
    return this.clientAdminService.toggleActivation(id, user);
  }

  /**
   * Obtiene todos los clientes basados en un filtro
   * @param {string} [filter]  Fecha de inicio
   * @param {string} [filter] Fecha de fin
   * @returns Todos los clientes
   */
  @Get('/all')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener todos los clientes' })
  @ApiOkResponse({ description: 'Clientes encontrados' })
  @ApiQuery({ type: ClientFilterDto, description: 'Filtro para obtener los clientes' })
  async getClients(@Query() filter: ClientFilterDto, @Res() res: Response) {
    const orders = await this.clientAdminService.getClients(filter);
    res.json(orders);
  }
}
