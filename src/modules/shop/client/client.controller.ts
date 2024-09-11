import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientDataUpdate, HttpResponse } from 'src/interfaces';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller({ path: 'shop/client', version: '1' })
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
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
