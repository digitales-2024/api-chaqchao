import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClassPriceService } from './class-price.service';
import { CreateClassPriceDto } from './dto/create-class-price.dto';
import { UpdateClassPriceDto } from './dto/update-class-price.dto';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { ClassPriceConfigData, HttpResponse, UserData } from 'src/interfaces';

@ApiTags('Class Price')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'class-price', version: '1' })
export class ClassPriceController {
  constructor(private readonly classPriceService: ClassPriceService) {}

  @ApiOkResponse({ description: 'Class Price created' })
  @Post()
  create(
    @Body() createClassPriceDto: CreateClassPriceDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassPriceConfigData>> {
    return this.classPriceService.create(createClassPriceDto, user);
  }

  @ApiOkResponse({ description: 'Get all class prices' })
  @Get()
  findAll(): Promise<ClassPriceConfigData[]> {
    return this.classPriceService.findAll();
  }

  @ApiOkResponse({ description: 'Get class price by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClassPriceConfigData> {
    return this.classPriceService.findOne(id);
  }

  @ApiOkResponse({ description: 'Class Price updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClassPriceDto: UpdateClassPriceDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassPriceConfigData>> {
    return this.classPriceService.update(id, updateClassPriceDto, user);
  }

  @ApiOkResponse({ description: 'Class Price deleted' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ClassPriceConfigData>> {
    return this.classPriceService.remove(id, user);
  }
}
