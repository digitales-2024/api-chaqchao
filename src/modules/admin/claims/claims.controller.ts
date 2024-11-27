import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags
} from '@nestjs/swagger';
import { HttpResponse, ClaimsData } from 'src/interfaces';
import { Auth } from '../auth/decorators';

@ApiTags('Claims')
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'claims',
  version: '1'
})
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @ApiCreatedResponse({ description: 'Claim created' })
  @Post()
  create(@Body() createClaimDto: CreateClaimDto): Promise<HttpResponse<ClaimsData>> {
    return this.claimsService.create(createClaimDto);
  }

  @Get()
  @ApiBadRequestResponse({ description: 'Not found claims' })
  @ApiOkResponse({ description: 'Get all claims' })
  @Auth()
  findAll(@Query('date') date?: string) {
    return this.claimsService.findAll(date);
  }
}
