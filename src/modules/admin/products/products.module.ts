import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CategoryModule } from '../category/category.module';
import { ProductVariationModule } from '../product-variation/product-variation.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [
    PrismaModule,
    forwardRef(() => CategoryModule),
    forwardRef(() => ProductVariationModule)
  ],
  exports: [ProductsService]
})
export class ProductsModule {}
