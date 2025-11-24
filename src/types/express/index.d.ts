// src/types/express/index.d.ts
declare global {
  namespace Express {
    interface User {
      id: number;
      role: string;
      // 可根据你的 JWT payload 添加其他字段，如 username、email 等
    }
    interface Request {
      user?: User;
    }
  }
}

export {};
