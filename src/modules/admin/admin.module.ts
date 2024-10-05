import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolModule } from './rol/rol.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { ModulesModule } from './modules/modules.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ProductsModule } from './products/products.module';
import { CategoryModule } from './category/category.module';
import { ProductVariationModule } from './product-variation/product-variation.module';
import { BusinessConfigModule } from './business-config/business-config.module';
import { BusinessHoursModule } from './business-hours/business-hours.module';
import { ClassScheduleModule } from './class-schedule/class-schedule.module';
import { ClassPriceModule } from './class-price/class-price.module';
import { ClassLanguageModule } from './class-language/class-language.module';
import { ClassRegistrationModule } from './class-registration/class-registration.module';
import { ClientAdminModule } from './client-admin/client-admin.module';
import { ReportsModule } from './reports/report.module';
import { ClassesAdminModule } from './classes-admin/classes-admin.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    RolModule,
    PrismaModule,
    AuditModule,
    ModulesModule,
    PermissionsModule,
    ProductsModule,
    CategoryModule,
    ProductVariationModule,
    BusinessConfigModule,
    BusinessHoursModule,
    ClassScheduleModule,
    ClassPriceModule,
    ClassLanguageModule,
    ClassRegistrationModule,
    ClientAdminModule,
    ReportsModule,
    ClassesAdminModule,
    OrdersModule
  ],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
