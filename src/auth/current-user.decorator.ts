// src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwt-payload.interface'; // 👈 确保路径正确！
import { CustomRequest } from '../type/index';
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<CustomRequest>();
    const user = request.user;

    if (!user) return null;

    return data ? user[data] : user;
  },
);
