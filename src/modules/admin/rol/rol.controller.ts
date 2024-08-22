import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { Auth, GetUser } from '../auth/decorators';
import { UpdateRolDto } from './dto/update-rol.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { HttpResponse, Rol, UserData } from 'src/interfaces';

@ApiTags('Rol')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBearerAuth()
@Controller({ path: 'rol', version: '1' })
@Auth()
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @ApiCreatedResponse({ description: 'Rol created' })
  @ApiBadRequestResponse({ description: 'Rol already exists and schema errors' })
  @ApiBody({ type: CreateRolDto })
  @Post()
  create(
    @Body() createRolDto: CreateRolDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<Rol>> {
    return this.rolService.create(createRolDto, user);
  }

  @ApiOkResponse({ description: 'Rol updated' })
  @ApiBadRequestResponse({ description: 'No data to update' })
  @ApiBody({ type: UpdateRolDto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRolDto: UpdateRolDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<Rol>> {
    return this.rolService.update(id, updateRolDto, user);
  }

  @ApiBadRequestResponse({ description: 'Rol no found' })
  @ApiOkResponse({ description: 'Rol deleted' })
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<Rol>> {
    return this.rolService.remove(id, user);
  }

  @ApiBadRequestResponse({ description: 'Rols no found' })
  @ApiOkResponse({ description: 'Rols found' })
  @Get()
  findAll(): Promise<Rol[]> {
    return this.rolService.findAll();
  }

  @ApiBadRequestResponse({ description: 'Rol no found' })
  @ApiOkResponse({ description: 'Rol found' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Rol> {
    return this.rolService.findById(id);
  }
}
