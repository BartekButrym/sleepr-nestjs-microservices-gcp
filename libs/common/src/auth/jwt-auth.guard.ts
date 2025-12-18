import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type ClientGrpc } from '@nestjs/microservices';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { UserDto } from '../dto';
import { AUTH_SERVICE_NAME, AuthServiceClient } from '../types';

type JwtRequest = {
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  user?: UserDto;
};

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private logger = new Logger(JwtAuthGuard.name);
  private authService: AuthServiceClient;

  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly client: ClientGrpc,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<JwtRequest>();
    const jwt =
      request.cookies?.Authentication || request.headers?.authentication;

    if (!jwt) {
      return false;
    }

    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    return this.authService
      .authenticate({
        Authentication: jwt,
      })
      .pipe(
        tap((res) => {
          if (roles && !roles.some((role) => res.roles?.includes(role))) {
            this.logger.error('The user does not have valid roles');
            throw new UnauthorizedException();
          }
          request.user = {
            ...res,
            _id: res.id,
          };
        }),
        map(() => true),
        catchError((err) => {
          this.logger.error(err);
          return of(false);
        }),
      );
  }
}
