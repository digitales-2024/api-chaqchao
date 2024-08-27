import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Auth, GetUser } from '../auth/decorators';
import { CategoryData, HttpResponse, UserData } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('Category')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({
  path: 'category',
  version: '1'
})
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiCreatedResponse({ description: 'Category created' })
  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.create(createCategoryDto, user);
  }

  @ApiOkResponse({ description: 'Get all categories' })
  @Get()
  findAll(): Promise<CategoryData[]> {
    return this.categoryService.findAll();
  }

  @ApiOkResponse({ description: 'Get category by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<CategoryData> {
    return this.categoryService.findOne(id);
  }

  @ApiOkResponse({ description: 'User updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.update(id, updateCategoryDto, user);
  }

  @ApiOkResponse({ description: 'Category deleted' })
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.remove(id, user);
  }

  @ApiOkResponse({ description: 'Category reactivated' })
  @Patch('reactivate/:id')
  reactivate(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.reactivate(id, user);
  }

  @ApiOkResponse({ description: 'Category desactivated' })
  @Patch('desactivate/:id')
  desactivate(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.desactivate(id, user);
  }
}
