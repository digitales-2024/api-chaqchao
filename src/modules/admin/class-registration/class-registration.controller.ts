import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassRegistrationService } from './class-registration.service';
import { CreateClassRegistrationDto } from './dto/create-class-registration.dto';
import { UpdateClassRegistrationDto } from './dto/update-class-registration.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { ClassRegistrationData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Class Registration')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({
  path: 'class-registration',
  version: '1'
})
export class ClassRegistrationController {
  constructor(private readonly classRegistrationService: ClassRegistrationService) {}

  @ApiOkResponse({ description: 'Class Registration created' })
  @Post()
  create(
    @Body() createClassRegistrationDto: CreateClassRegistrationDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassRegistrationData>> {
    return this.classRegistrationService.create(createClassRegistrationDto, user);
  }

  @ApiOkResponse({ description: 'Get all class registrations' })
  @Get()
  findAll(): Promise<ClassRegistrationData[]> {
    return this.classRegistrationService.findAll();
  }

  @ApiOkResponse({ description: 'Get class registration by Id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClassRegistrationData> {
    return this.classRegistrationService.findOne(id);
  }

  @ApiOkResponse({ description: 'Class Registration updated' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClassRegistrationDto: UpdateClassRegistrationDto) {
    return this.classRegistrationService.update(+id, updateClassRegistrationDto);
  }

  @ApiOkResponse({ description: 'Class Registration deleted' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classRegistrationService.remove(+id);
  }
}
