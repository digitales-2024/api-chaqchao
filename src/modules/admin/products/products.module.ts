import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CategoryModule } from '../category/category.module';
import { ProductVariationModule } from '../product-variation/product-variation.module';
import { CloudflareModule } from 'src/modules/cloudflare/cloudflare.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [
    PrismaModule,
    forwardRef(() => CategoryModule),
    forwardRef(() => ProductVariationModule),
    CloudflareModule
  ],
  exports: [ProductsService]
})
export class ProductsModule {}
