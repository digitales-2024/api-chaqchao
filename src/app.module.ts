import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { ShopModule } from './modules/shop/shop.module';
import { SharedModule } from './modules/shared/shared.module';
import { SeedsModule } from './modules/seeds/seeds.module';
import { EmailModule } from './modules/email/email.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypedEventEmitterModule } from './event-emitter/typed-event-emitter.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PrismaModule,
    AdminModule,
    ShopModule,
    SharedModule,
    SeedsModule,
    EmailModule,
    EventEmitterModule.forRoot(),
    TypedEventEmitterModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
