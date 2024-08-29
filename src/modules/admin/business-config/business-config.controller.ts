import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { BusinessConfigService } from './business-config.service';
import { CreateBusinessConfigDto } from './dto/create-business-config.dto';
import { BusinessConfigData, UserData } from 'src/interfaces';
import { Auth, GetUser } from '../auth/decorators';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('BusinessConfig')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Auth()
@Controller({
  path: 'business-config',
  version: '1'
})
export class BusinessConfigController {
  constructor(private readonly businessConfigService: BusinessConfigService) {}

  @Post()
  create(
    @Body() createBusinessConfigDto: CreateBusinessConfigDto,
    @GetUser() user: UserData
  ): Promise<BusinessConfigData> {
    return this.businessConfigService.createUpdate(createBusinessConfigDto, user);
  }

  @Get()
  findAll() {
    return this.businessConfigService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessConfigService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessConfigService.remove(+id);
  }
}
