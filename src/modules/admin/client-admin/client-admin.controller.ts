import { Controller, Get } from '@nestjs/common';
import { ClientAdminService } from './client-admin.service';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators';
import { ClientPayload } from 'src/interfaces';

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
}
