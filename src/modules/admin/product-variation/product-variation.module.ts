import { Module, forwardRef } from '@nestjs/common';
import { ProductVariationService } from './product-variation.service';
import { ProductsModule } from '../products/products.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [ProductVariationService],
  imports: [PrismaModule, forwardRef(() => ProductsModule)],
  exports: [ProductVariationService]
})
export class ProductVariationModule {}
