import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '../interfaces';

interface RequestWithUser {
  user: User;
}

const getCurrentUserByContext = (context: ExecutionContext): User => {
  const request = context.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, contex: ExecutionContext) => getCurrentUserByContext(contex),
);
