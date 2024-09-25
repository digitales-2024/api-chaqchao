import { Body, Controller, Get, Post } from '@nestjs/common';
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
}
