import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './interfaces/user.interface';
import { Auth } from '../auth/decorators';

@Controller({
  path: 'users',
  version: '1'
})
@Auth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto, @GetUser() user: User) {
    return this.usersService.create(createUserDto, user);
  }

  @Get('profile')
  profile(@GetUser() user: User) {
    return user;
  }

  @Get('generate-password')
  generatePassword() {
    return this.usersService.generatePassword();
  }
}
