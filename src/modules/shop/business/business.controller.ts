import { Controller, Get } from '@nestjs/common';
import { BusinessService } from './business.service';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags
} from '@nestjs/swagger';

@ApiTags('Business')
@Controller({
  path: 'business',
  version: '1'
})
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiOkResponse({ description: 'Business data' })
  @Get()
  findBusiness() {
    return this.businessService.findBusiness();
  }
}
