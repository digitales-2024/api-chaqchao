import { Module } from '@nestjs/common';
import { ClassLanguageService } from './class-language.service';
import { ClassLanguageController } from './class-language.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BusinessConfigModule } from '../business-config/business-config.module';

@Module({
  controllers: [ClassLanguageController],
  providers: [ClassLanguageService],
  imports: [PrismaModule, BusinessConfigModule],
  exports: [ClassLanguageService]
})
export class ClassLanguageModule {}
