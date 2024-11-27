import { Controller, Get, Body, Patch, Param, Res, Delete, Post } from '@nestjs/common';
import { ClientService } from './client.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientData, ClientDataUpdate, ClientPayload, HttpResponse } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
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
   * Busca un cliente por su id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar un cliente por su id' })
  @ApiOkResponse({ description: 'Obtenga el cliente con éxito' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ClientAuth()
  async findOne(@Param('id') id: string): Promise<ClientPayload> {
    return this.clientService.findOne(id);
  }

  /**
   * Actualiza un cliente
   */

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiOkResponse({ description: 'Cliente actualizada con éxito' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ClientAuth()
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto
  ): Promise<HttpResponse<ClientDataUpdate>> {
    return this.clientService.update(id, updateClientDto);
  }

  /**
   * Elimina un cliente
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un cliente' })
  @ApiOkResponse({ description: 'Cliente eliminada exitosamente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ClientAuth()
  async remove(@Param('id') id: string, @Res() res: Response) {
    const result = await this.clientService.remove(id, res);
    return res.status(result.statusCode).json(result);
  }

  /**
   * Actualiza la contraseña del cliente
   */
  @Patch('password/:id')
  @ApiOperation({ summary: 'Actualizar la contraseña del cliente' })
  @ApiOkResponse({ description: 'Contraseña del cliente actualizada correctamente' })
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
   */
  @Patch('activate/:id')
  @ApiOperation({ summary: 'Activar un cliente' })
  @ApiOkResponse({ description: 'Cliente activada exitosamente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ClientAuth()
  async activate(@Param('id') id: string): Promise<HttpResponse<ClientData>> {
    return this.clientService.activate(id);
  }

  /**
   * Buscar un cliente por su email
   */
  @Get('email/:email')
  @ApiOperation({ summary: 'Buscar un cliente por su email' })
  @ApiOkResponse({ description: 'Cliente encontrador con éxito' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  async findByEmail(@Param('email') email: string): Promise<ClientData> {
    return this.clientService.findByEmailInformation(email);
  }

  /**
   * Compruebe si la cliente existe por su email
   */
  @Post('email')
  @ApiOperation({ summary: 'Compruebe si la cliente existe por su email' })
  @ApiOkResponse({ description: 'Cliente encontrado con éxito' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  async existByEmail(@Body() body: FindClientByEmailDto): Promise<boolean> {
    return this.clientService.checkEmailExist(body.email);
  }
}
