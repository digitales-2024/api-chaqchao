import { Controller, Post, Body } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators';

@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTags('Admin Audit')
@Auth()
@Controller({
  path: 'audit',
  version: '1'
})
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Crear una nueva entrada de auditoría.
   * @param createAuditdto: el objeto de transferencia de datos que contiene detalles para la nueva auditoría.
   * @returns una promesa que se resuelve cuando la entrada de auditoría se crea con éxito.
   */
  @Post()
  @ApiOperation({ summary: 'Crear una nueva entrada de auditoría' })
  @ApiCreatedResponse({ description: 'Auditoría creada' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  create(@Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(createAuditDto);
  }
}
