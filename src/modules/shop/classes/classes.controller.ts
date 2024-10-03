import { Controller, Post, Body } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags
} from '@nestjs/swagger';
import { ClassesData, HttpResponse } from 'src/interfaces';

@ApiTags('Classes')
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'classes',
  version: '1'
})
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @ApiCreatedResponse({ description: 'Class created' })
  @Post()
  create(@Body() createClassDto: CreateClassDto): Promise<HttpResponse<ClassesData>> {
    return this.classesService.create(createClassDto);
  }
}
