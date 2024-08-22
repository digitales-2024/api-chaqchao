import { Controller, Post } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Seeds')
@Controller({
  path: 'seeds',
  version: '1'
})
export class SeedsController {
  constructor(private readonly seedsService: SeedsService) {}

  @Post()
  initDataBase() {
    return this.seedsService.generateSuperAdmin();
  }

  @Post('modules')
  initModules() {
    return this.seedsService.generateModules();
  }

  @Post('permissions')
  initPermissions() {
    return this.seedsService.generatePermissions();
  }
}
