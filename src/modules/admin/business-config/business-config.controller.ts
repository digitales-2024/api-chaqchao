import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { BusinessConfigService } from './business-config.service';
import { CreateBusinessConfigDto } from './dto/create-business-config.dto';
import { BusinessConfigData, HttpResponse, UserData } from 'src/interfaces';
import { Auth, GetUser } from '../auth/decorators';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { UpdateBusinessConfigDto } from './dto/update-business-config.dto';

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

  @ApiOkResponse({ description: 'Business Config created' })
  @Post()
  create(
    @Body() createBusinessConfigDto: CreateBusinessConfigDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<BusinessConfigData>> {
    return this.businessConfigService.create(createBusinessConfigDto, user);
  }

  @ApiOkResponse({ description: 'Business Config updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBusinessConfigDto: UpdateBusinessConfigDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<BusinessConfigData>> {
    return this.businessConfigService.update(id, updateBusinessConfigDto, user);
  }

  @ApiOkResponse({ description: 'Get business config by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<BusinessConfigData> {
    return this.businessConfigService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessConfigService.remove(+id);
  }
}
