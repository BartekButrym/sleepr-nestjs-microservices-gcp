import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

type AuthenticatedRequest = Request & {
  Authentication?: unknown;
  cookies?: {
    Authentication?: unknown;
    [key: string]: unknown;
  };
};
import { UsersService } from '../users/users.service';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: AuthenticatedRequest) => {
          const cookieToken = request?.cookies?.Authentication;
          if (typeof cookieToken === 'string') {
            return cookieToken;
          }

          const requestToken = request?.Authentication;

          if (typeof requestToken === 'string') {
            return requestToken;
          }

          if (request.headers.Authentication) {
            return request.headers.Authentication as string;
          }

          return null;
        },
      ]),
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  async validate({ userId }: TokenPayload) {
    return await this.usersService.getUser({ id: userId });
  }
}
