import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassScheduleService } from './class-schedule.service';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { ClassScheduleData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Class Schedule')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({
  path: 'class-schedule',
  version: '1'
})
export class ClassScheduleController {
  constructor(private readonly classScheduleService: ClassScheduleService) {}
  @ApiOkResponse({ description: 'Class Schedule created' })
  @Post()
  create(
    @Body() createClassScheduleDto: CreateClassScheduleDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassScheduleData>> {
    return this.classScheduleService.create(createClassScheduleDto, user);
  }

  @ApiOkResponse({ description: 'Get all class schedules' })
  @Get()
  findAll(): Promise<ClassScheduleData[]> {
    return this.classScheduleService.findAll();
  }

  @ApiOkResponse({ description: 'Get class schedule by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClassScheduleData> {
    return this.classScheduleService.findOne(id);
  }

  @ApiOkResponse({ description: 'Class Schedule updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClassScheduleDto: UpdateClassScheduleDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassScheduleData>> {
    return this.classScheduleService.update(id, updateClassScheduleDto, user);
  }

  @ApiOkResponse({ description: 'Class Schedule deleted' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassScheduleData>> {
    return this.classScheduleService.remove(id, user);
  }
}
