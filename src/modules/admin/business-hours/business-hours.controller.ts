import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { BusinessHoursService } from './business-hours.service';
import { CreateBusinessHourDto } from './dto/create-business-hour.dto';
import { UpdateBusinessHourDto } from './dto/update-business-hour.dto';
import { Auth, GetUser } from '../auth/decorators';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AllBusinessHoursData, BusinessHoursData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('BusinessHours')
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

  @ApiOkResponse({ description: 'Get all business hours' })
  @Get()
  findAll(): Promise<AllBusinessHoursData> {
    return this.businessHoursService.findAll();
  }

  @ApiOkResponse({ description: 'Get business hour by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<BusinessHoursData> {
    return this.businessHoursService.findOne(id);
  }

  @ApiOkResponse({ description: 'Business hours updated successfully' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBusinessHourDto: UpdateBusinessHourDto,
    @GetUser() user: UserData
  ) {
    return this.businessHoursService.update(id, updateBusinessHourDto, user);
  }

  /*   @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessHoursService.remove(+id);
  } */
}
