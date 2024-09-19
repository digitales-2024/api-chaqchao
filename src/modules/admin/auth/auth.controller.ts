import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ApiCreatedResponse, ApiInternalServerErrorResponse, ApiTags } from '@nestjs/swagger';
import { Response, Request } from 'express';

@ApiTags('Auth')
@ApiInternalServerErrorResponse({
  description: 'Internal server error'
})
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiCreatedResponse({ description: 'Login user' })
  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto, @Res() res: Response): Promise<void> {
    return this.authService.login(loginAuthDto, res);
  }

  @ApiCreatedResponse({ description: 'Logout user' })
  @Post('logout')
  async logout(@Res() res: Response): Promise<void> {
    return this.authService.logout(res);
  }

  @ApiCreatedResponse({ description: 'Update password' })
  @Post('update-password')
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Res() res: Response
  ): Promise<void> {
    return this.authService.updatePasswordTemp(updatePasswordDto, res);
  }

  @ApiCreatedResponse({ description: 'Refresh token' })
  @Post('refresh-token')
  async refreshToken(@Res() res: Response, @Req() req: Request): Promise<void> {
    return this.authService.refreshToken(res, req);
  }
}
