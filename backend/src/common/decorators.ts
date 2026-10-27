import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser, DevicePrincipal } from './auth-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    return context.switchToHttp().getRequest<{ user: AuthUser }>().user;
  },
);

export const CurrentDevice = createParamDecorator(
  (_data: unknown, context: ExecutionContext): DevicePrincipal => {
    return context.switchToHttp().getRequest<{ device: DevicePrincipal }>().device;
  },
);

export const RequestMeta = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const agent = request.headers['user-agent'];
    return {
      ip: request.ip,
      userAgent: Array.isArray(agent) ? agent[0] : agent,
    };
  },
);
