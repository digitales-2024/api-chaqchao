import { Controller, Get, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { Auth, GetUser } from '../auth/decorators';
import { User } from '../users/interfaces/user.interface';

@Controller({ path: 'rol', version: '1' })
@Auth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto, @GetUser() user: User) {
    return this.roleService.create(createRoleDto, user);
  }

  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findById(@GetUser() user: User) {
    return this.roleService.findById(user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() createRoleDto: CreateRoleDto, @GetUser() user: User) {
    return this.roleService.update(id, createRoleDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
