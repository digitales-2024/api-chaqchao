import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { ClassesConfigService } from './classes-config.service';
import { CreateClassesConfigDto } from './dto/create-classes-config.dto';
import { ClassConfigData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Classes Config')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'classes-config', version: '1' })
export class ClassesConfigController {
  constructor(private readonly classesConfigService: ClassesConfigService) {}

  @Post()
  create(
    @Body() createClassesConfigDto: CreateClassesConfigDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassConfigData>> {
    return this.classesConfigService.create(createClassesConfigDto, user);
  }
}
