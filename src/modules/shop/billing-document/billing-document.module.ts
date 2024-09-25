import { BillingDocumentController } from './billing-document.controller';
import { BillingDocumentService } from './billing-document.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { forwardRef, Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';

@Module({
  controllers: [BillingDocumentController],
  providers: [BillingDocumentService],
  imports: [PrismaModule, forwardRef(() => OrderModule)],
  exports: [BillingDocumentService]
})
export class BillingDocumentModule {}
