import { Controller, Get } from '@nestjs/common';
import { BusinessService } from './business.service';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';

@ApiTags('Shop Business')
@Controller({
  path: 'business',
  version: '1'
})
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  /**
   * Encuentra los datos comerciales de la tienda
   *
   * @returns Los datos comerciales de la tienda
   */
  @Get()
  @ApiOperation({ summary: 'Encontrar datos comerciales' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiOkResponse({ description: 'Business data' })
  findBusiness() {
    return this.businessService.findBusiness();
  }
}
