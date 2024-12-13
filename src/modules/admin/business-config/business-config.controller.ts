import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { BusinessConfigService } from './business-config.service';
import { CreateBusinessConfigDto } from './dto/create-business-config.dto';
import { BusinessConfigData, HttpResponse, UserData } from 'src/interfaces';
import { Auth, GetUser, Module, Permission } from '../auth/decorators';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { UpdateBusinessConfigDto } from './dto/update-business-config.dto';

@ApiTags('Admin Business')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Auth()
@Module('BNSS')
@Controller({
  path: 'business-config',
  version: '1'
})
export class BusinessConfigController {
  constructor(private readonly businessConfigService: BusinessConfigService) {}

  /**
   * Crea los datos de una empresa
   * @param createBusinessConfigDto Data de la empresa a crear
   * @param user Usuario que realiza la creacion
   * @returns Empresa creada
   */
  @Post()
  @Permission(['CREATE'])
  @ApiOperation({ summary: 'Crear una empresa' })
  @ApiOkResponse({ description: 'Empresa creada' })
  @ApiBody({ type: CreateBusinessConfigDto, description: 'Datos de la empresa a crear' })
  create(
    @Body() createBusinessConfigDto: CreateBusinessConfigDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<BusinessConfigData>> {
    return this.businessConfigService.create(createBusinessConfigDto, user);
  }

  /**
   * Actualiza los datos de una empresa
   * @param id Id de la empresa a actualizar
   * @param updateBusinessConfigDto Data de la empresa a actualizar
   * @param user Usuario que realiza la actualizacion
   * @returns Empresa actualizada
   */
  @Patch(':id')
  @Permission(['UPDATE'])
  @ApiOperation({ summary: 'Actualizar una empresa' })
  @ApiOkResponse({ description: 'Empresa actualizada' })
  @ApiBody({ type: UpdateBusinessConfigDto, description: 'Datos de la empresa a actualizar' })
  @ApiParam({ name: 'id', description: 'Id de la empresa a actualizar' })
  update(
    @Param('id') id: string,
    @Body() updateBusinessConfigDto: UpdateBusinessConfigDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<BusinessConfigData>> {
    return this.businessConfigService.update(id, updateBusinessConfigDto, user);
  }

  /**
   * Obtener todas las empresas
   * @returns Empresas encontradas
   */
  @Get()
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener todas las empresas' })
  @ApiOkResponse({ description: 'Empresas encontradas' })
  findAll(): Promise<BusinessConfigData[]> {
    return this.businessConfigService.findAll();
  }

  /**
   * Obtener una empresa por su id
   * @param id Id de la empresa a obtener
   * @returns Empresa encontrada
   */
  @Get(':id')
  @Permission(['READ'])
  @ApiOperation({ summary: 'Obtener una empresa por su id' })
  @ApiOkResponse({ description: 'Empresa encontrada' })
  @ApiParam({ name: 'id', description: 'Id de la empresa a obtener' })
  findOne(@Param('id') id: string): Promise<BusinessConfigData> {
    return this.businessConfigService.findOne(id);
  }

  /**
   * Elimina una empresa por su id
   * @param id Id de la empresa a eliminar
   * @returns Empresa eliminada
   */
  @Delete(':id')
  @Permission(['DELETE'])
  @ApiOperation({ summary: 'Eliminar una empresa por su id' })
  @ApiOkResponse({ description: 'Empresa eliminada' })
  @ApiParam({ name: 'id', description: 'Id de la empresa a eliminar' })
  remove(@Param('id') id: string) {
    return this.businessConfigService.remove(+id);
  }
}
