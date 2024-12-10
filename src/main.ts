import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [process.env.WEB_URL, process.env.WEB_URL_SHOP],
    credentials: true
  });
  app.use(cookieParser());

  app.enableVersioning({
    type: VersioningType.URI
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  const config = new DocumentBuilder()
    .setTitle('Chaqchao API')
    .setDescription('API for Chaqchao')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  document.tags = [
    { name: 'Admin Auth', description: 'Operaciones de autenticación y autorización' },
    { name: 'Admin Account', description: 'Gestión de cuentas de administrador y configuraciones' },
    { name: 'Admin Users', description: 'Gestión de usuarios administradores' },
    { name: 'Admin Roles', description: 'Gestión de roles de administradores' },
    { name: 'Admin Modules', description: 'Gestión de módulos' },
    { name: 'Admin Permissions', description: 'Gestión de permisos' },
    { name: 'Admin Products', description: 'Gestión de productos' },
    { name: 'Admin Categories', description: 'Gestión de categorías' },
    { name: 'Admin Orders', description: 'Gestión de pedidos' },
    { name: 'Admin Reports', description: 'Gestión de reportes' },
    { name: 'Admin Business', description: 'Gestión de negocios' },
    { name: 'Admin Settings', description: 'Gestión de configuraciones' },
    { name: 'Admin Classes', description: 'Gestión de clases' },
    { name: 'Admin Clients', description: 'Gestión de clientes' },
    { name: 'Admin Audit', description: 'Gestión de auditoría' },
    { name: 'Admin Claims', description: 'Gestión de reclamos' },
    // Shop
    { name: 'Shop Auth', description: 'Operaciones sobre la autenticación de la tienda' },
    { name: 'Shop Client', description: 'Operaciones sobre los clientes de la tienda' },
    { name: 'Shop Catalog', description: 'Operaciones sobre los productos de la tienda' },
    { name: 'Shop Cart', description: 'Operaciones sobre el carrito de la tienda' },
    { name: 'Shop Order', description: 'Operaciones sobre las órdenes de la tienda' },
    { name: 'Shop Billing', description: 'Operaciones sobre la facturación de la tienda' },
    { name: 'Shop Classes', description: 'Operaciones sobre las clases de la tienda' },
    { name: 'Shop Business', description: 'Operaciones sobre la información de la tienda' },
    { name: 'Shop Claims', description: 'Operaciones sobre los reclamos de la tienda' }
  ];

  SwaggerModule.setup('api', app, document);

  await app.listen(parseInt(process.env.PORT));
}
bootstrap();
