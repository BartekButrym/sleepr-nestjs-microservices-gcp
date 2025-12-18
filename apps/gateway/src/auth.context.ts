import { UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AUTH_SERVICE, UserDto } from '@app/common';
import { app } from './app';

interface AuthContextRequest {
  headers?: {
    authentication?: string;
  };
}

export const authContext = async ({ req }: { req: AuthContextRequest }) => {
  try {
    const authClient = app.get<ClientProxy>(AUTH_SERVICE);
    const user = await lastValueFrom<UserDto>(
      authClient.send('authenticate', {
        Authentication: req.headers?.authentication,
      }),
    );
    return { user };
  } catch (error) {
    throw new UnauthorizedException(error);
  }
};
