import { AccessTokenPayload } from '@/shared/utils/token';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      requestId?: string;
    }
  }
}

export {};
