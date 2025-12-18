import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { AUTH_SERVICE, LoggerModule } from '@app/common';
import { authContext } from './auth.context';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      useFactory: (configService: ConfigService) => ({
        server: {
          context: authContext,
        },
        gateway: {
          supergraphSdl: new IntrospectAndCompose({
            subgraphs: [
              {
                name: 'reservations',
                url: configService.getOrThrow<string>(
                  'RESERVATIONS_GRAPHQL_URL',
                ),
              },
              {
                name: 'auth',
                url: configService.getOrThrow<string>('AUTH_GRAPHQL_URL'),
              },
              {
                name: 'payments',
                url: configService.getOrThrow<string>('PAYMENTS_GRAPHQL_URL'),
              },
            ],
          }),
          buildService({ url }) {
            return new RemoteGraphQLDataSource({
              url,
              willSendRequest({ request, context }) {
                if (request.http && context.user) {
                  request.http.headers.set(
                    'user',
                    JSON.stringify(context.user),
                  );
                }
              },
            });
          },
        },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.getOrThrow<string>('AUTH_HOST'),
            port: configService.getOrThrow<number>('AUTH_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
  ],
  controllers: [],
  providers: [],
})
export class GatewayModule {}
