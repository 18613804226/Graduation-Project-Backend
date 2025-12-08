// src/types/index.ts
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

export interface CustomRequest extends Request {
  user: JwtPayload;
}
