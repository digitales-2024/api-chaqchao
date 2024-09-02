import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BusinessHoursService } from './business-hours.service';
import { CreateBusinessHourDto } from './dto/create-business-hour.dto';
import { UpdateBusinessHourDto } from './dto/update-business-hour.dto';
import { Auth, GetUser } from '../auth/decorators';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { BusinessHoursData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('BusinessHours')
@ApiBearerAuth()
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

  @ApiOkResponse({ description: 'Business Hour created' })
  @Post()
  create(
    @Body() createBusinessHourDto: CreateBusinessHourDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<BusinessHoursData>> {
    return this.businessHoursService.create(createBusinessHourDto, user);
  }

  @Get()
  findAll() {
    return this.businessHoursService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessHoursService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusinessHourDto: UpdateBusinessHourDto) {
    return this.businessHoursService.update(+id, updateBusinessHourDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessHoursService.remove(+id);
  }
}
