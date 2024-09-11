import { Controller, Post, Body, Get, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Auth } from '../auth/decorators';
import { UpdateUserDto } from './dto';
import { SendEmailDto } from './dto/send-email.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { HttpResponse, UserData, UserDataLogin } from 'src/interfaces';

@ApiTags('Users')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'users',
  version: '1'
})
@Auth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiCreatedResponse({ description: 'User created' })
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @GetUser() user: UserDataLogin
  ): Promise<HttpResponse<UserData>> {
    return this.usersService.create(createUserDto, user);
  }

  @ApiOkResponse({ description: 'User updated' })
  @Patch(':id')
  update(
    @Body() updateUserDto: UpdateUserDto,
    @Param('id') id: string,
    @GetUser() user: UserDataLogin
  ) {
    return this.usersService.update(updateUserDto, id, user);
  }

  @ApiOkResponse({ description: 'User deleted' })
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserDataLogin): Promise<HttpResponse<UserData>> {
    return this.usersService.remove(id, user);
  }

  @ApiOkResponse({ description: 'User deactivated' })
  @Patch('reactivate/:id')
  reactivate(
    @Param('id') id: string,
    @GetUser() user: UserDataLogin
  ): Promise<HttpResponse<UserData>> {
    return this.usersService.reactivate(id, user);
  }

  @ApiOkResponse({ description: 'Get all users' })
  @Get()
  findAll(): Promise<UserData[]> {
    return this.usersService.findAll();
  }

  @ApiOkResponse({ description: 'Get user by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserData> {
    return this.usersService.findOne(id);
  }

  @ApiOkResponse({ description: 'Get new password' })
  @Post('generate-password')
  generatePassword(): HttpResponse<string> {
    return this.usersService.generatePassword();
  }

  @ApiOkResponse({ description: 'Send email' })
  @Post('send-email')
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.usersService.sendEmail(sendEmailDto);
  }
}
