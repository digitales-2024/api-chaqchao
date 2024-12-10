import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { BusinessHoursService } from './business-hours.service';
import { CreateBusinessHourDto } from './dto/create-business-hour.dto';
import { UpdateBusinessHourDto } from './dto/update-business-hour.dto';
import { Auth, GetUser } from '../auth/decorators';
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
import { AllBusinessHoursData, BusinessHoursData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Admin Business')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Auth()
@Controller({
  path: 'business-hours',
  version: '1'
})
export class BusinessHoursController {
  constructor(private readonly businessHoursService: BusinessHoursService) {}

  /**
   * Crea el horario de atencion de un negocio
   * @param createBusinessHourDto Data del horario de atencion a crear
   * @param user Usuario que realiza la creaci n
   * @returns Horario de atencion creado
   */
  @Post()
  @ApiOperation({ summary: 'Crear un horario de atencion' })
  @ApiOkResponse({ description: 'Horario de atencion creado' })
  @ApiBody({ type: CreateBusinessHourDto, description: 'Datos del horario de atencion a crear' })
  create(
    @Body() createBusinessHourDto: CreateBusinessHourDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<BusinessHoursData>> {
    return this.businessHoursService.create(createBusinessHourDto, user);
  }

  /**
   * Mostrar todos los horarios de atencion de los negocios
   * @returns Un objeto con una lista de horarios de atencion y la informacion del negocio
   */
  @Get()
  @ApiOperation({ summary: 'Mostrar todos los horarios de atencion' })
  @ApiOkResponse({ description: 'Lista de horarios de atencion' })
  findAll(): Promise<AllBusinessHoursData> {
    return this.businessHoursService.findAll();
  }

  /**
   * Mostrar un horario de atencion por id
   * @param id Id del horario de atencion
   * @returns Horario de atencion encontrado
   */
  @Get(':id')
  @ApiOperation({ summary: 'Mostrar un horario de atencion por id' })
  @ApiOkResponse({ description: 'Horario de atencion encontrado' })
  @ApiParam({ name: 'id', description: 'Id del horario de atencion' })
  findOne(@Param('id') id: string): Promise<BusinessHoursData> {
    return this.businessHoursService.findOne(id);
  }

  /**
   * Actualizar un horario de atencion
   * @param id Id del horario de atencion a actualizar
   * @param updateBusinessHourDto Data del horario de atencion a actualizar
   * @param user Usuario que realiza la actualizaci n
   * @returns Horario de atencion actualizado
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un horario de atencion' })
  @ApiOkResponse({ description: 'Horario de atencion actualizado' })
  @ApiBody({
    type: UpdateBusinessHourDto,
    description: 'Datos del horario de atencion a actualizar'
  })
  @ApiParam({ name: 'id', description: 'Id del horario de atencion' })
  update(
    @Param('id') id: string,
    @Body() updateBusinessHourDto: UpdateBusinessHourDto,
    @GetUser() user: UserData
  ) {
    return this.businessHoursService.update(id, updateBusinessHourDto, user);
  }

  /*   @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessHoursService.remove(+id);
  } */
}
