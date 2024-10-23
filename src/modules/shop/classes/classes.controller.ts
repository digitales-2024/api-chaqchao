import { Controller, Post, Body, Get } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags
} from '@nestjs/swagger';
import { ClassesData, ClassLanguageData, ClassScheduleData, HttpResponse } from 'src/interfaces';
import { ClassScheduleService } from 'src/modules/admin/class-schedule/class-schedule.service';
import { ClassLanguageService } from 'src/modules/admin/class-language/class-language.service';

@ApiTags('Classes')
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'classes',
  version: '1'
})
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly classScheduleService: ClassScheduleService,
    private readonly classLanguageService: ClassLanguageService
  ) {}

  @ApiCreatedResponse({ description: 'Class created' })
  @Post()
  create(@Body() createClassDto: CreateClassDto): Promise<HttpResponse<ClassesData>> {
    return this.classesService.create(createClassDto);
  }

  @ApiBadRequestResponse({ description: 'Not found class' })
  @Get()
  findAll(): Promise<ClassScheduleData[]> {
    return this.classScheduleService.findAll();
  }

  @ApiBadRequestResponse({ description: 'Not found language class' })
  @Get('/languages')
  findAllLanguages(): Promise<ClassLanguageData[]> {
    return this.classLanguageService.findAll();
  }
}
