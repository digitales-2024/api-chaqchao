import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientDataUpdate, ClientPayload, HttpResponse } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('Client shop')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({ path: 'shop/client', version: '1' })
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @ApiOkResponse({ description: 'Client updated successfully' })
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
  remove(@Param('id') id: string) {
    return this.clientService.remove(id);
  }
}
