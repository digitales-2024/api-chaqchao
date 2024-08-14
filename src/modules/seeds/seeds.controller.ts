import { Controller, Post } from '@nestjs/common';
import { SeedsService } from './seeds.service';

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
}
