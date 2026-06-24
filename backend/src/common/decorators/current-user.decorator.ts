import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUser } from '../../auth/auth.service';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const gqlCtx = GqlExecutionContext.create(ctx);
  return gqlCtx.getContext<{ req: { user: AuthUser } }>().req.user;
});
