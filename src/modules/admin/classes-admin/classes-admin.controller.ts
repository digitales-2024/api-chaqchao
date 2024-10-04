import { Controller, Get, Query } from '@nestjs/common';
import { ClassesAdminService } from './classes-admin.service';
import { Auth } from '../auth/decorators';
import { ClassesDataAdmin } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('Class Admin')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'admin/class', version: '1' })
export class ClassesAdminController {
  constructor(private readonly classesAdminService: ClassesAdminService) {}

  @ApiOkResponse({ description: 'Get class by date' })
  @Get()
  findByDate(@Query('date') date: string): Promise<ClassesDataAdmin[]> {
    return this.classesAdminService.findByDate(date);
  }

  /*   @ApiOkResponse({ description: 'Get all classes' })
  @Get()
  findAll(): Promise<ClassesDataAdmin[]> {
    return this.classesAdminService.findAll();
  } */
}
