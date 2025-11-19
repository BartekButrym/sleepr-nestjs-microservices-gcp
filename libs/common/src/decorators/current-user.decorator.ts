import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../models';

interface RequestWithUser {
  user: UserDocument;
}

const getCurrentUserByContext = (context: ExecutionContext): UserDocument => {
  const request = context.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, contex: ExecutionContext) => getCurrentUserByContext(contex),
);
