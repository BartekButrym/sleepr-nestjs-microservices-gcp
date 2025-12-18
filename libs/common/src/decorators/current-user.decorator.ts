import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../models';

interface RequestWithUser {
  user: UserDocument;
}

interface GraphQLContext {
  req: {
    headers: {
      user?: string;
    };
  };
}

const getCurrentUserByContext = (context: ExecutionContext): UserDocument => {
  if (context.getType() === 'http') {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  }

  const graphqlContext = context.getArgs()[2] as GraphQLContext;
  const user = graphqlContext?.req?.headers?.user;

  if (!user) {
    throw new Error('User not found in context');
  }

  return JSON.parse(user) as UserDocument;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, contex: ExecutionContext) => getCurrentUserByContext(contex),
);
