import { Controller, Get, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../users/interfaces/user.interface';

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
  findById(@GetUser() user: User) {
    return this.rolService.findById(user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() createRolDto: CreateRolDto, @GetUser() user: User) {
    return this.rolService.update(id, createRolDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolService.remove(id);
  }
}
