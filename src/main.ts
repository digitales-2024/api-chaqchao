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
    { name: 'Admin', description: 'Operations about admin' },
    { name: 'Users', description: 'Operations about users' },
    { name: 'Rol', description: 'Operations about roles' },
    { name: 'Modules', description: 'Operations about modules' },
    { name: 'Permissions', description: 'Operations about permissions' },
    { name: 'Products', description: 'Operations about products' },
    { name: 'Category', description: 'Operations about categories' },
    { name: 'Order', description: 'Operations about orders' },
    { name: 'Cart', description: 'Operations about cart' },
    { name: 'CartItem', description: 'Operations about cart items' },
    { name: 'Admin Audit', description: 'Operaciones sobre auditoría' },
    // Shop
    { name: 'Shop Auth', description: 'Operaciones sobre la autenticación de la tienda' },
    { name: 'Shop Client', description: 'Operaciones sobre los clientes de la tienda' },
    { name: 'Shop Cart', description: 'Operaciones sobre el carrito de la tienda' },
    { name: 'Shop Order', description: 'Operaciones sobre las órdenes de la tienda' },
    { name: 'Shop Product', description: 'Operaciones sobre los productos de la tienda' },
    { name: 'Shop Class', description: 'Operaciones sobre las clases de la tienda' }
  ];

  SwaggerModule.setup('api', app, document);

  await app.listen(parseInt(process.env.PORT));
}
bootstrap();
