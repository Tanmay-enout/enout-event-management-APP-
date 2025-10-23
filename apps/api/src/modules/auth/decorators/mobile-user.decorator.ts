import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const MobileUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // This will be the attendee object from MobileJwtStrategy
  },
);

