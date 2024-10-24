import {
  Controller,
  Get,
  Res,
  Req,
  UseGuards,
  HttpStatus,
  Post,
  Body,
  Query
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-guards.guard';
import { AuthGuard } from '@nestjs/passport';
import { GetClient } from './decorators/get-client.decorator';
import { ClientData, HttpResponse } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { LoginAuthClientDto } from './dto/login-auth-client.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { ForgotPasswordClientDto } from './dto/forgot-password-client.dto';
import { ResetPasswordClientDto } from './dto/reset-password-client.dto';
import { ClientAuth } from './decorators/client-auth.decorator';
import { ClientRefreshAuth } from './decorators/client-refresh-auth.decorator';

@ApiTags('Auth Client')
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Controller({ path: 'auth/client', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @ApiOkResponse({ description: 'Google login redirect' })
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  handleLogin() {}

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async handleRedirect(@Req() req: Request, @Res() res: Response) {
    const webUrlShop = this.configService.get<string>('WEB_URL_SHOP');
    if (req.user) {
      // Redirigir al usuario a la URL especificada en WEB_URL_SHOP
      return res.redirect(webUrlShop);
    } else {
      // Manejar el caso en que la autenticación falla o el usuario cancela el proceso

      return res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage('authentication_failed', '${webUrlShop}');
              window.close();
            </script>
          </body>
        </html>
      `);
    }
  }

  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ClientAuth()
  @ApiOkResponse({ description: 'Client profile' })
  @Get('profile')
  @UseGuards(AuthGuard('client-jwt'))
  getClientProfile(@GetClient() client: ClientData) {
    return client;
  }

  @ApiOkResponse({ description: 'Client logged in successfully' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  @Post('login')
  async login(@Body() loginAuthClientDto: LoginAuthClientDto, @Res() res: Response): Promise<void> {
    const clientDataLogin = await this.authService.login(loginAuthClientDto, res);
    res.status(HttpStatus.OK).json(clientDataLogin);
  }

  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiOkResponse({ description: 'Client successfully registered' })
  @Post('register')
  async register(@Body() createClientDto: CreateClientDto, @Res() res: Response): Promise<void> {
    const clientDataRegister = await this.authService.create(createClientDto, res);
    res.status(HttpStatus.OK).json(clientDataRegister);
  }

  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  @ApiOkResponse({ description: 'Email sent successfully' })
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordClientDto: ForgotPasswordClientDto
  ): Promise<HttpResponse<string>> {
    return this.authService.forgotPassword(forgotPasswordClientDto);
  }

  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Client not found' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  @Post('reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body() resetPasswordClientDto: ResetPasswordClientDto
  ): Promise<HttpResponse<string>> {
    return this.authService.resetPassword(token, resetPasswordClientDto);
  }

  @ClientAuth()
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiOkResponse({ description: 'Logout client' })
  @Get('logout')
  async logout(@Res() res: Response): Promise<void> {
    return this.authService.logout(res);
  }

  @ApiCreatedResponse({ description: 'Refresh token' })
  @ClientRefreshAuth()
  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.authService.refreshToken(req, res);
  }
}
