import { Body, Controller, Get, Patch, Version } from '@nestjs/common';
import { Auth, GetUser } from './auth/decorators';
import { AdminService } from './admin.service';
import { UpdatePasswordDto } from './auth/dto/update-password.dto';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Admin Account')
@ApiUnauthorizedResponse({
  description: 'Unauthorized'
})
@ApiBadRequestResponse({
  description: 'Bad request'
})
@ApiInternalServerErrorResponse({
  description: 'Internal server error'
})
@Controller()
@Auth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Obtenga el perfil del usuario iniciado
   * @param user El usuario iniciado
   * @returns El perfil de usuario
   */
  @Get('profile')
  @ApiOperation({ summary: 'Obtener el perfil del usuario iniciado' })
  @ApiOkResponse({ description: 'El perfil de usuario' })
  @Version('1')
  getProfile(@GetUser() user: UserData): UserData {
    return this.adminService.getProfile(user);
  }

  /**
   * Actualizar la contrase a del usuario
   * @param updatePassword Nuevos datos de la contrase a
   * @param user El usuario que est  iniciando sesi n
   * @returns Un mensaje de confirmaci n de la actualizaci n de la contrase a
   */
  @Patch('update-password')
  @ApiOperation({ summary: 'Actualizar la contraseña del usuario' })
  @ApiOkResponse({ description: 'Mensaje de confirmación de la actualización de la contraseña' })
  @Version('1')
  updatePassword(
    @Body() updatePassword: UpdatePasswordDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<string>> {
    return this.adminService.updatePassword(updatePassword, user);
  }
}
