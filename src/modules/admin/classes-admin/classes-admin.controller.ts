import { Controller, Get, Param, Delete, Query } from '@nestjs/common';
import { ClassesAdminService } from './classes-admin.service';
import { Auth } from '../auth/decorators';
import { ClassesData } from 'src/interfaces';
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

  @ApiOkResponse({ description: 'Get all classes' })
  @Get()
  findAll(): Promise<ClassesData[]> {
    return this.classesAdminService.findAll();
  }

  @ApiOkResponse({ description: 'Get class by date' })
  @Get('find/date')
  findByDate(@Query('date') date: string): Promise<ClassesData[]> {
    return this.classesAdminService.findByDate(date);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classesAdminService.remove(id);
  }
}