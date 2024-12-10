import { Controller, Get, Body, Patch, Param, Res, Delete, Post } from '@nestjs/common';
import { ClientService } from './client.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientData, ClientDataUpdate, ClientPayload, HttpResponse } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ClientAuth } from '../auth/decorators/client-auth.decorator';
import { Response } from 'express';
import { UpdatePasswordClientDto } from './dto/update-password-client.dto';
import { FindClientByEmailDto } from './dto/find-client-by-email.dto';

@ApiTags('Shop Client')
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({ path: 'shop/client', version: '1' })
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  /**
   * Buscar un cliente por su id
   * @param id Id del cliente
   * @returns Cliente encontrado
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar un cliente por su id' })
  @ApiOkResponse({ description: 'Obtenga el cliente con éxito' })
  @ApiParam({ name: 'id', description: 'Id del cliente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ClientAuth()
  async findOne(@Param('id') id: string): Promise<ClientPayload> {
    return this.clientService.findOne(id);
  }

  /**
   * Actualizar un cliente
   * @param id Id del cliente
   * @param updateClientDto Data del cliente a actualizar
   * @returns Cliente actualizado
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiOkResponse({ description: 'Cliente actualizada con éxito' })
  @ApiParam({ name: 'id', description: 'Id del cliente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ClientAuth()
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto
  ): Promise<HttpResponse<ClientDataUpdate>> {
    return this.clientService.update(id, updateClientDto);
  }
  /**
   * Elimina un cliente por su ID y elimina la cookie de acceso.
   * @param id Id del cliente
   * @param res Respuesta HTTP para manipular las cookies y devolver el resultado
   * @returns Respuesta HTTP con el estado y mensaje de la operación de eliminación
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un cliente' })
  @ApiOkResponse({ description: 'Cliente eliminada exitosamente' })
  @ApiParam({ name: 'id', description: 'Id del cliente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ClientAuth()
  async remove(@Param('id') id: string, @Res() res: Response) {
    const result = await this.clientService.remove(id, res);
    return res.status(result.statusCode).json(result);
  }

  /**
   * Actualizar la contraseña del cliente
   * @param id Id del cliente
   * @param updatePasswordClientDto Data para actualizar la contraseña
   * @returns Contraseña actualizada
   */
  @Patch('password/:id')
  @ApiOperation({ summary: 'Actualizar la contraseña del cliente' })
  @ApiOkResponse({ description: 'Contraseña del cliente actualizada correctamente' })
  @ApiParam({ name: 'id', description: 'Id del cliente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ClientAuth()
  async updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordClientDto: UpdatePasswordClientDto
  ): Promise<HttpResponse<ClientData>> {
    return this.clientService.updatePassword(id, updatePasswordClientDto);
  }

  /**
   * Activar un cliente
   * @param id Id del cliente
   * @returns Cliente activada
   */
  @Patch('activate/:id')
  @ApiOperation({ summary: 'Activar un cliente' })
  @ApiOkResponse({ description: 'Cliente activada exitosamente' })
  @ApiParam({ name: 'id', description: 'Id del cliente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ClientAuth()
  async activate(@Param('id') id: string): Promise<HttpResponse<ClientData>> {
    return this.clientService.activate(id);
  }

  /**
   * Buscar un cliente por su email
   * @param email Email del cliente
   * @returns Cliente encontrado
   */
  @Get('email/:email')
  @ApiOperation({ summary: 'Buscar un cliente por su email' })
  @ApiOkResponse({ description: 'Cliente encontrador con éxito' })
  @ApiParam({ name: 'email', description: 'Email del cliente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  async findByEmail(@Param('email') email: string): Promise<ClientData> {
    return this.clientService.findByEmailInformation(email);
  }

  /**
   * Compruebe si la cliente existe por su email
   * @param body Data para buscar un cliente por su email
   * @returns true si el cliente existe, false de lo contrario
   */
  @Post('email')
  @ApiOperation({ summary: 'Compruebe si la cliente existe por su email' })
  @ApiOkResponse({ description: 'Cliente encontrado con éxito' })
  @ApiBody({ type: FindClientByEmailDto, description: 'Data para buscar un cliente por su email' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  async existByEmail(@Body() body: FindClientByEmailDto): Promise<boolean> {
    return this.clientService.checkEmailExist(body.email);
  }
}
