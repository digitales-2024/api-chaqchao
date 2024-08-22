import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  document.tags = [
    { name: 'Auth', description: 'Operations about authentication' },
    { name: 'Admin', description: 'Operations about admin' },
    { name: 'Users', description: 'Operations about users' },
    { name: 'Rol', description: 'Operations about roles' },
    { name: 'Modules', description: 'Operations about modules' },
    { name: 'Permissions', description: 'Operations about permissions' },
    { name: 'Products', description: 'Operations about products' },
    { name: 'Orders', description: 'Operations about orders' },
    { name: 'Audit', description: 'Operations about audit' }
  ];

  SwaggerModule.setup('api', app, document);

  await app.listen(parseInt(process.env.PORT));
}
bootstrap();
