import { Body, Controller, Get, Patch, Version } from '@nestjs/common';
import { Auth, GetUser } from './auth/decorators';
import { AdminService } from './admin.service';
import { User } from './users/interfaces/user.interface';
import { UpdatePasswordDto } from './auth/dto/update-password.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller()
@Auth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('profile')
  @Version('1')
  getProfile(@GetUser() user: User) {
    return this.adminService.getProfile(user);
  }

  @Patch('update-password')
  @Version('1')
  updatePassword(@Body() updatePassword: UpdatePasswordDto, @GetUser() user: User) {
    return this.adminService.updatePassword(updatePassword, user);
  }
}
