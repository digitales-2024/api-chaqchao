import { PrismaModule } from 'src/prisma/prisma.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Module } from '@nestjs/common';
import { ProductsService } from 'src/modules/admin/products/products.service';
import { CategoryService } from 'src/modules/admin/category/category.service';
import { ProductVariationService } from 'src/modules/admin/product-variation/product-variation.service';
import { CloudflareService } from 'src/modules/cloudflare/cloudflare.service';
import { ReportsService } from 'src/modules/admin/reports/report.service';

@Module({
  controllers: [CatalogController],
  providers: [
    CatalogService,
    ReportsService,
    ProductsService,
    CategoryService,
    ProductVariationService,
    CloudflareService
  ],
  imports: [PrismaModule]
})
export class CatalogModule {}
