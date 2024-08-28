import { Module, forwardRef } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductsModule } from '../products/products.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports: [
    PrismaModule,
    forwardRef(() => ProductsModule) // Utiliza forwardRef aquí
  ],
  exports: [CategoryService]
})
export class CategoryModule {}
