import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassLanguageService } from './class-language.service';
import { CreateClassLanguageDto } from './dto/create-class-language.dto';
import { UpdateClassLanguageDto } from './dto/update-class-language.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { ClassLanguageData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Class Language')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'class-language', version: '1' })
export class ClassLanguageController {
  constructor(private readonly classLanguageService: ClassLanguageService) {}

  @ApiOkResponse({ description: 'Class Language created' })
  @Post()
  create(
    @Body() createClassLanguageDto: CreateClassLanguageDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassLanguageData>> {
    return this.classLanguageService.create(createClassLanguageDto, user);
  }

  @ApiOkResponse({ description: 'Get all class languages' })
  @Get()
  findAll(): Promise<ClassLanguageData[]> {
    return this.classLanguageService.findAll();
  }

  @ApiOkResponse({ description: 'Get class language by Id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classLanguageService.findOne(+id);
  }

  @ApiOkResponse({ description: 'Class Language updated' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClassLanguageDto: UpdateClassLanguageDto) {
    return this.classLanguageService.update(+id, updateClassLanguageDto);
  }

  @ApiOkResponse({ description: 'Class Language deleted' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classLanguageService.remove(+id);
  }
}
