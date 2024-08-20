import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { Auth, GetUser } from '../auth/decorators';
import { UpdateRolDto } from './dto/update-rol.dto';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponse, Rol, UserData } from 'src/interfaces';

@ApiTags('Rol')
@Controller({ path: 'rol', version: '1' })
@Auth()
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Post()
  create(
    @Body() createRolDto: CreateRolDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<Rol>> {
    return this.rolService.create(createRolDto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRolDto: UpdateRolDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<Rol>> {
    return this.rolService.update(id, updateRolDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<HttpResponse<Rol>> {
    return this.rolService.remove(id);
  }

  @Get()
  findAll(): Promise<Rol[]> {
    return this.rolService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Rol> {
    return this.rolService.findById(id);
  }
}
