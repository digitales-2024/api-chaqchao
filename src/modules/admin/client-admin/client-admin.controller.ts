import { Controller, Get, Patch, Param, Body, Query, Res } from '@nestjs/common';
import { ClientAdminService } from './client-admin.service';
import { UpdateClientDto } from '../../shop/client/dto/update-client.dto';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { ClientPayload, UserData } from 'src/interfaces';
import { Response } from 'express';
import { ClientFilterDto } from './dto/client-filter.dto';

@ApiTags('Client Admin')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Auth()
@Controller({
  path: 'admin/client',
  version: '1'
})
export class ClientAdminController {
  constructor(private readonly clientAdminService: ClientAdminService) {}

  @ApiOkResponse({ description: 'Get all client' })
  @Get()
  findAll(): Promise<ClientPayload[]> {
    return this.clientAdminService.findAll();
  }
  @ApiOkResponse({ description: 'Update client admin' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() UpdateClientDto: UpdateClientDto,
    @GetUser() user: UserData
  ): Promise<ClientPayload> {
    return this.clientAdminService.update(id, UpdateClientDto, user);
  }
  @ApiOkResponse({ description: 'Client admin desactivate/activate' })
  @Patch('desactivate/:id')
  reactivate(@Param('id') id: string, @GetUser() user: UserData): Promise<ClientPayload> {
    return this.clientAdminService.toggleActivation(id, user);
  }

  @ApiOkResponse({ description: 'Get all client' })
  @Get('/all')
  async getClients(@Query() filter: ClientFilterDto, @Res() res: Response) {
    const orders = await this.clientAdminService.getClients(filter);
    res.json(orders);
  }
}
