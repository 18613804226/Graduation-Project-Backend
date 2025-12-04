// src/auth/guards/roles.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride < string[] > ('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // 未设置 @Roles()，放行
        }

        const { user } = context.switchToHttp().getRequest();

        // 用户必须存在（由 JwtAuthGuard 保证，但双重保险）
        if (!user) {
            throw new ForbiddenException('未认证');
        }

        // 🔒 关键修复：确保 user 有 role 字段
        if (!user.role) {
            throw new ForbiddenException('用户角色信息缺失，请重新登录');
        }

        const hasRole = requiredRoles.some((role) => user.role === role);
        if (!hasRole) {
            throw new ForbiddenException('权限不足');
        }

        return true;
    }
}