import { Module, forwardRef } from '@nestjs/common';
import { ProductVariationService } from './product-variation.service';
import { ProductVariationController } from './product-variation.controller';
import { ProductsModule } from '../products/products.module'; // Importa el ProductsModule
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ProductVariationController],
  providers: [ProductVariationService],
  imports: [PrismaModule, forwardRef(() => ProductsModule)]
})
export class ProductVariationModule {}
