import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './interfaces/user.interface';
import { Auth } from '../auth/decorators';
import { ValidRoles } from '../auth/interfaces';
import { AuthGuard } from '@nestjs/passport';

@Controller({
  path: 'users',
  version: '1'
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return 'users list';
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createUserDto: CreateUserDto, @GetUser() user: User) {
    return this.usersService.create(createUserDto, user);
  }

  @Get('profile')
  @Auth(ValidRoles.ADMIN)
  profile(@GetUser() user: User) {
    return user;
  }
}
