import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../users/interfaces/user.interface';
import { UpdateRolDto } from './dto/update-rol.dto';

@Controller({ path: 'rol', version: '1' })
@Auth()
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Post()
  create(@Body() createRolDto: CreateRolDto, @GetUser() user: User) {
    return this.rolService.create(createRolDto, user);
  }

  @Get()
  findAll() {
    return this.rolService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.rolService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRolDto: UpdateRolDto, @GetUser() user: User) {
    return this.rolService.update(id, updateRolDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolService.remove(id);
  }
}
