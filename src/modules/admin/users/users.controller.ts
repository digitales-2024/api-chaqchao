import { Controller, Post, Body, Get, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './interfaces/user.interface';
import { Auth } from '../auth/decorators';
import { UpdateUserDto } from './dto';
import { SendEmailDto } from './dto/send-email.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
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

  @Patch(':id')
  update(@Body() updateUserDto: UpdateUserDto, @Param('id') id: string, @GetUser() user: User) {
    return this.usersService.update(updateUserDto, id, user);
  }

  @Delete(':id')
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.usersService.remove(user, id);
  }

  @Get('profile')
  profile(@GetUser() user: User) {
    return this.usersService.profile(user);
  }

  @Get('generate-password')
  generatePassword() {
    return this.usersService.generatePassword();
  }

  @Get('send-email')
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.usersService.sendEmail(sendEmailDto);
  }
}
