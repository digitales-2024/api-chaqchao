import {
  Controller,
  Get /* , Post, Body, Patch, Param, Delete */,
  Res,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './utils/Guards';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*   @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  } */

  @Get('google/login')
  handleLogin(@Res() res: Response) {
    const clientId = '356142009565-ulu3ffrsmocaib7uiuerqr2ulk6kbb65.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:3000/api/v1/auth/google/redirect';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=email%20profile&access_type=offline&prompt=consent`;
    return res.redirect(googleAuthUrl);
  }

  // api/v1/google/redirect
  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  handleRedirect() {
    return { msg: 'OK' };
  }

  /*   @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  } */
}
