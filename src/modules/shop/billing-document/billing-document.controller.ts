import { Controller, Get } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth } from 'src/modules/admin/auth/decorators';
import { BillingDocumentService } from './billing-document.service';
import { BillingDocumentData } from 'src/interfaces/billing-document.interface';

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
}
