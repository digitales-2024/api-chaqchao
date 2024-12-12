import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { HttpResponse, ClaimsData } from 'src/interfaces';
import { Auth, Module, Permission } from '../auth/decorators';

@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'claims',
  version: '1'
})
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  /**
   * Crear un nuevo reclamo.
   *
   * @param createClaimDto - El objeto de transferencia de datos que contiene la información requerida para crear un reclamo.
   * @returns Una promesa que se resuelve a un httpponse que contiene los datos de reclamo creados.
   */
  @Post()
  @ApiTags('Shop Claims')
  @ApiOperation({ summary: 'Crear un nuevo reclamo' })
  @ApiCreatedResponse({ description: 'Reclamo creado' })
  @ApiBody({ type: CreateClaimDto, description: 'Datos del reclamo' })
  create(@Body() createClaimDto: CreateClaimDto): Promise<HttpResponse<ClaimsData>> {
    return this.claimsService.create(createClaimDto);
  }

  /**
   * Listar todos los reclamos.
   *
   * @param date - La fecha desde la que se desean obtener los reclamos.
   * @returns Una promesa que se resuelve a un httpponse que contiene los datos de los reclamos.
   */
  @Get()
  @ApiTags('Admin Claims')
  @ApiOperation({ summary: 'Listar todos los reclamos' })
  @ApiOkResponse({ description: 'Reclamos listados' })
  @ApiQuery({
    name: 'date',
    description: 'Fecha desde la que se desean obtener los reclamos',
    required: false
  })
  @Auth()
  @Module('CLM')
  @Permission(['READ'])
  findAll(@Query('date') date?: string) {
    return this.claimsService.findAll(date);
  }
}
