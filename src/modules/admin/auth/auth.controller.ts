import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ApiCreatedResponse, ApiInternalServerErrorResponse, ApiTags } from '@nestjs/swagger';
import { UserDataLogin } from 'src/interfaces';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiCreatedResponse({ description: 'Login user' })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error | You must change your password'
  })
  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto): Promise<UserDataLogin> {
    return this.authService.login(loginAuthDto);
  }

  @ApiCreatedResponse({ description: 'Update password' })
  @Post('update-password')
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    return this.authService.updatePasswordTemp(updatePasswordDto);
  }
}
