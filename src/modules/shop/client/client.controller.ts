import { Controller, Get, Body, Patch, Param, Res, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientData, ClientDataUpdate, ClientPayload, HttpResponse } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ClientAuth } from '../auth/decorators/client-auth.decorator';
import { Response } from 'express';
import { UpdatePasswordClientDto } from './dto/update-password-client.dto';

@ClientAuth()
@ApiTags('Client Shop')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({ path: 'shop/client', version: '1' })
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @ApiOkResponse({ description: 'Get Client successfully' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClientPayload> {
    return this.clientService.findOne(id);
  }

  @ApiOkResponse({ description: 'Client updated successfully' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto
  ): Promise<HttpResponse<ClientDataUpdate>> {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    const result = await this.clientService.remove(id, res);
    return res.status(result.statusCode).json(result);
  }

  @ApiOkResponse({ description: 'Client password updated sucessfully' })
  @Patch('password/:id')
  async updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordClientDto: UpdatePasswordClientDto
  ): Promise<HttpResponse<ClientData>> {
    return this.clientService.updatePassword(id, updatePasswordClientDto);
  }

  @ApiOkResponse({ description: 'Client activated successfully' })
  @Patch('activate/:id')
  async activate(@Param('id') id: string): Promise<HttpResponse<ClientData>> {
    return this.clientService.activate(id);
  }
}
