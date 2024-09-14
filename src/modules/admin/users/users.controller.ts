import { Controller, Post, Body, Get, Patch, Param, Delete, Logger } from '@nestjs/common';
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
import { HttpResponse, UserData, UserDataLogin, UserPayload } from 'src/interfaces';
import { DeleteUsersDto } from './dto/delete-users.dto';

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
  private readonly logger = new Logger(UsersController.name);
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

  @ApiOkResponse({ description: 'Users deactivated' })
  @Delete('deactivate/all')
  deactivate(
    @Body() users: DeleteUsersDto,
    @GetUser() user: UserDataLogin
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.usersService.deactivate(users, user);
  }

  @ApiOkResponse({ description: 'User reactivated' })
  @Patch('reactivate/:id')
  reactivate(
    @Param('id') id: string,
    @GetUser() user: UserDataLogin
  ): Promise<HttpResponse<UserData>> {
    return this.usersService.reactivate(id, user);
  }

  @ApiOkResponse({ description: 'Get all users' })
  @Get()
  findAll(): Promise<UserPayload[]> {
    return this.usersService.findAll();
  }

  @ApiOkResponse({ description: 'Get user by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserData> {
    return this.usersService.findOne(id);
  }

  @ApiOkResponse({ description: 'Get new password' })
  @Post('generate-password')
  generatePassword(): { password: string } {
    return this.usersService.generatePassword();
  }

  @ApiOkResponse({ description: 'Send email' })
  @Post('send-email')
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.usersService.sendEmail(sendEmailDto);
  }
}
