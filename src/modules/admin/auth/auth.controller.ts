import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { RefreshAuth } from './decorators';

@ApiTags('Admin Auth')
@ApiInternalServerErrorResponse({
  description: 'Internal server error'
})
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inicia la sesión del usuario admin
   * @param loginAuthDto  Datos para iniciar sesión
   * @param res  Respuesta HTTP
   * @returns  Promesa que se resuelve con los datos del usuario logueado
   */
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion del usuario admin' })
  @ApiBadRequestResponse({ description: 'Credenciales no válidas' })
  @ApiCreatedResponse({ description: 'Iniciar sesión con éxito' })
  async login(@Body() loginAuthDto: LoginAuthDto, @Res() res: Response): Promise<void> {
    return this.authService.login(loginAuthDto, res);
  }

  /**
   * Cierra la sesión del usuario admin
   * @param res  Respuesta HTTP
   * @returns  Promesa que se resuelve con la respuesta de logout
   */
  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión del usuario admin' })
  @ApiCreatedResponse({ description: 'Cierre sesión con éxito' })
  @ApiBadRequestResponse({ description: 'Error al cerrar la sesión' })
  async logout(@Res() res: Response): Promise<void> {
    return this.authService.logout(res);
  }

  /**
   * Actualiza la contraseña temporal del usuario admin
   * @param updatePasswordDto Datos para actualizar la contraseña
   * @param res Respuesta HTTP
   * @returns Promesa que se resuelve con los datos del usuario logueado
   */
  @Post('update-password')
  @ApiOperation({ summary: 'Actualizar contraseña temporal del usuario admin' })
  @ApiCreatedResponse({ description: 'Actualización de contraseña con éxito' })
  @ApiBadRequestResponse({ description: 'Error al actualizar la contraseña' })
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Res() res: Response
  ): Promise<void> {
    return this.authService.updatePasswordTemp(updatePasswordDto, res);
  }

  /**
   * Refresca el token de acceso del usuario admin
   * @param req  Petición HTTP
   * @param res  Respuesta HTTP
   * @returns  Promesa que se resuelve con la respuesta de refresh token
   */
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refrescar token de acceso del usuario admin' })
  @ApiCreatedResponse({ description: 'Token de acceso refrescado con éxito' })
  @ApiBadRequestResponse({ description: 'Error al refrescar el token de acceso' })
  @RefreshAuth()
  async refreshToken(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.authService.refreshToken(req, res);
  }
}
