import { Controller, Post, Body } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags
} from '@nestjs/swagger';

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
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }
}
