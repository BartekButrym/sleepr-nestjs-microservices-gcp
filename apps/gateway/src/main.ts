import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { GatewayModule } from './gateway.module';
import { setApp } from './app';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  app.useLogger(app.get(Logger));
  const configService = app.get(ConfigService);
  await app.listen(configService.getOrThrow<number>('PORT'));
  setApp(app);
}
void bootstrap();
