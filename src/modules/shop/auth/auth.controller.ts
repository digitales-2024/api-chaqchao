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
import { GetClient } from './decorators/get-client.decorator';
import { ClientData, HttpResponse } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
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

@ApiTags('Shop Auth')
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Controller({ path: 'auth/client', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Redirigir al usuario a la página de inicio de sesión de Google.
   */

  @Get('google/login')
  @ApiOperation({ summary: 'Redirigir al usuario a la página de inicio de sesión de Google' })
  @UseGuards(GoogleAuthGuard)
  handleLogin() {}

  /**
   * Manejar la redirección de Google.
   */
  @Get('google/redirect')
  @ApiOperation({ summary: 'Manejar la redirección de Google' })
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

  /**
   * Mostrar el perfil del cliente.
   */
  @Get('profile')
  @ApiOperation({ summary: 'Mostrar el perfil del cliente' })
  @ApiBadRequestResponse({ description: 'Ocurrio un error al mostrar el perfil del cliente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiOkResponse({ description: 'Perfil del cliente' })
  @ClientAuth()
  getClientProfile(@GetClient() client: ClientData) {
    return client;
  }

  /**
   * Iniciar sesión del cliente.
   */
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión del cliente' })
  @ApiOkResponse({ description: 'El cliente inició sesión correctamente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta ' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrada' })
  async login(@Body() loginAuthClientDto: LoginAuthClientDto, @Res() res: Response): Promise<void> {
    const clientDataLogin = await this.authService.login(loginAuthClientDto, res);
    res.status(HttpStatus.OK).json(clientDataLogin);
  }

  /**
   * Registrar un nuevo cliente.
   */
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo cliente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiOkResponse({ description: 'Cliente registrado correctamente' })
  async register(@Body() createClientDto: CreateClientDto, @Res() res: Response): Promise<void> {
    const clientDataRegister = await this.authService.create(createClientDto, res);
    res.status(HttpStatus.OK).json(clientDataRegister);
  }

  /**
   * Enviar un correo electrónico para restablecer la contraseña.
   */
  @Post('forgot-password')
  @ApiOperation({ summary: 'Enviar un correo electrónico para restablecer la contraseña' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrada' })
  @ApiOkResponse({ description: 'Correo electrónico enviado correctamente' })
  async forgotPassword(
    @Body() forgotPasswordClientDto: ForgotPasswordClientDto
  ): Promise<HttpResponse<string>> {
    return this.authService.forgotPassword(forgotPasswordClientDto);
  }

  /**
   * Restablecer la contraseña del cliente.
   */
  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer la contraseña del cliente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrada' })
  @ApiOkResponse({ description: 'Restablecer la contraseña correctamente' })
  async resetPassword(
    @Query('token') token: string,
    @Body() resetPasswordClientDto: ResetPasswordClientDto
  ): Promise<HttpResponse<string>> {
    return this.authService.resetPassword(token, resetPasswordClientDto);
  }

  /**
   * Cerrar sesión del cliente.
   */
  @Get('logout')
  @ApiOperation({ summary: 'Cerrar sesión del cliente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiOkResponse({ description: 'Se cerró la sesión correctamente' })
  @ClientAuth()
  async logout(@Res() res: Response): Promise<void> {
    return this.authService.logout(res);
  }

  /**
   * Refrescar el token de autenticación.
   */
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refrescar el token de autenticación' })
  @ApiCreatedResponse({ description: 'Actualización del token' })
  @ClientRefreshAuth()
  async refreshToken(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.authService.refreshToken(req, res);
  }
}
