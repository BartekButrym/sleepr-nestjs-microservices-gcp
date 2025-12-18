import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { PaymentsModule } from './payments.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: configService.get<number>('PORT_TCP'),
    },
  });

  app.useLogger(app.get(Logger));
  await app.startAllMicroservices();
  await app.listen(configService.getOrThrow<number>('PORT_HTTP'));
}
void bootstrap();
