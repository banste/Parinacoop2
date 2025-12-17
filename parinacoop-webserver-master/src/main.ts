import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from '@fastify/helmet';

import metadata from './metadata';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://parinacoop-webapp.vercel.app/',
      'https://cooperativa.fjsolutions.online',
    ],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  await app.register(helmet);

  const config = new DocumentBuilder()
    .setTitle('API Rest de Parinacoop')
    .setDescription(
      'Servidor API REST para la aplicación desarrollada en Angular para el sistema de contratación de productos en línea de la cooperativa Parinacoop.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  await SwaggerModule.loadPluginMetadata(metadata);
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);

  const configService = app.get(ConfigService);
  const port = +configService.get('PORT') || 3000;

  await app.listen(port, '0.0.0.0', (_err, address) => {
    console.log(`Listening to ${address}`);
  });
}
bootstrap();
