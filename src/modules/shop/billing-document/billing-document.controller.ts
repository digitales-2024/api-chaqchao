import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth } from 'src/modules/admin/auth/decorators';
import { BillingDocumentService } from './billing-document.service';
import { BillingDocumentData } from 'src/interfaces/billing-document.interface';
import { CreateBillingDocumentDto } from './dto/create-billing-document.dto';
import { HttpResponse } from 'src/interfaces';
import { UpdateStatusBillingDocumentDto } from './dto/update-status-billing.dto';

@ApiTags('BillingDocument')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
@ApiBadRequestResponse({ description: 'Bad Request' })
@Auth()
@Controller({
  path: 'billing-document',
  version: '1'
})
export class BillingDocumentController {
  constructor(private readonly billingDocumentService: BillingDocumentService) {}

  @ApiOkResponse({ description: 'Get all billing documents' })
  @Get()
  findAll(): Promise<BillingDocumentData[]> {
    return this.billingDocumentService.findAll();
  }

  @ApiCreatedResponse({ description: 'Billing Document created' })
  @Post()
  create(
    @Body() createBillingDocumentDto: CreateBillingDocumentDto
  ): Promise<HttpResponse<BillingDocumentData>> {
    return this.billingDocumentService.create(createBillingDocumentDto);
  }
  @ApiOkResponse({ description: 'Billing Document Status updated' })
  @Patch(':id/status')
  async updateBillingDocumentStatus(
    @Param('id') id: string,
    @Body() updateStatusBillingDocumentDto: UpdateStatusBillingDocumentDto
  ): Promise<HttpResponse<BillingDocumentData>> {
    return this.billingDocumentService.updateBillingDocumentStatus(
      id,
      updateStatusBillingDocumentDto
    );
  }
}
