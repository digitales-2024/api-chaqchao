import { Controller, Post, Body, Get, Patch, Param, Delete, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Auth, Module, Permission } from '../auth/decorators';
import { UpdateUserDto } from './dto';
import { SendEmailDto } from './dto/send-email.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { HttpResponse, UserData, UserPayload } from 'src/interfaces';
import { DeleteUsersDto } from './dto/delete-users.dto';

@ApiTags('Admin Users')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'users',
  version: '1'
})
@Auth()
@Module('USR')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  /**
   * Crear un usuario
   * @param createUserDto Data del usuario a crear
   * @param user Usuario que crea el usuario
   * @returns Objeto con los datos del usuario creado
   */
  @Post()
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Crear un usuario' })
  @ApiCreatedResponse({ description: 'Usuario creado con exito' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<UserData>> {
    return this.usersService.create(createUserDto, user);
  }

  /**
   * Mostrar todos los usuarios
   * @param user Usuario que busca los usuarios
   * @returns Retorna un array con los datos de los usuarios
   */
  @Get()
  @Permission(['READ'])
  @ApiOperation({ summary: 'Mostrar todos los usuarios' })
  @ApiOkResponse({ description: 'Usuarios obtenidos con exito' })
  findAll(@GetUser() user: UserPayload): Promise<UserPayload[]> {
    return this.usersService.findAll(user);
  }

  /**
   * Obtener un usuario por su ID
   * @param id ID del usuario a buscar
   * @returns Promesa que resuelve con los datos del usuario encontrado
   */
  @Get(':id')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener un usuario por su ID' })
  @ApiOkResponse({ description: 'Usuario obtenido con éxito' })
  findOne(@Param('id') id: string): Promise<UserData> {
    return this.usersService.findOne(id);
  }

  /**
   * Actualizar un usuario
   * @param updateUserDto Data del usuario a actualizar
   * @param id Id del usuario a actualizar
   * @param user Usuario que actualiza el usuario
   * @returns Objeto con los datos del usuario actualizado
   */
  @Patch(':id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiOkResponse({ description: 'Usuario actualizada' })
  update(@Body() updateUserDto: UpdateUserDto, @Param('id') id: string, @GetUser() user: UserData) {
    return this.usersService.update(updateUserDto, id, user);
  }

  /**
   * Eliminar un usuario
   * @param id Id del usuario a eliminar
   * @param user Usuario que elimina el usuario
   * @returns Objeto con los datos del usuario eliminado
   */
  @Delete(':id')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiOkResponse({ description: 'Usuario eliminada' })
  remove(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<UserData>> {
    return this.usersService.remove(id, user);
  }

  /**
   * Desactivar varios usuarios seleccionados
   * @param users Arreglo de usuarios a desactivar
   * @param user Usuario que desactiva los usuarios
   * @returns Retorna un mensaje de la desactivacion correcta
   */
  @Delete('deactivate/all')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Desactivar varios usuarios seleccionados' })
  @ApiOkResponse({ description: 'Usuarios desactivadas' })
  deactivate(
    @Body() users: DeleteUsersDto,
    @GetUser() user: UserData
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.usersService.deactivate(users, user);
  }

  /**
   * Reactivar varios usuarios seleccionados
   * @param user Usuario que reactiva los usuarios
   * @param users Arreglo de usuarios a reactivar
   * @returns Retorna un mensaje de la reactivacion correcta
   */
  @Patch('reactivate/all')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Reactivar varios usuarios seleccionados' })
  @ApiOkResponse({ description: 'Usuarios reactivadas' })
  reactivateAll(@GetUser() user: UserData, @Body() users: DeleteUsersDto) {
    return this.usersService.reactivateAll(user, users);
  }

  /**
   * Reactivar un usuario por su ID.
   * @param id ID del usuario a reactivar.
   * @param user Usuario que realiza la acción de reactivación.
   * @returns Promesa que resuelve con los datos del usuario reactivado.
   */
  @Patch('reactivate/:id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Reactivar un usuario por su ID' })
  @ApiOkResponse({ description: 'Usuario reactivada' })
  reactivate(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<UserData>> {
    return this.usersService.reactivate(id, user);
  }

  /**
   * Genera una nueva contraseña aleatoria.
   * @returns Un objeto que contiene la contraseña recién generada.
   */
  @Post('generate-password')
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Generar una nueva contraseña' })
  @ApiOkResponse({ description: 'Obtener una nueva contraseña' })
  generatePassword(): { password: string } {
    return this.usersService.generatePassword();
  }

  /**
   * Enviar un correo electrónico con una nueva contraseña temporal
   * @param sendEmailDto Data para enviar el correo electrónico
   * @param user Usuario que envia el correo electrónico
   * @returns Estado del envio del correo electrónico
   */
  @Post('send-new-password')
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Enviar un correo electrónico con una nueva contraseña temporal' })
  @ApiOkResponse({ description: 'Enviar una nueva contraseña' })
  sendNewPassword(@Body() sendEmailDto: SendEmailDto, @GetUser() user: UserData) {
    return this.usersService.sendNewPassword(sendEmailDto, user);
  }
}
