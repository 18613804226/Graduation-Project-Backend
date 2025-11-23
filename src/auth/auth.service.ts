/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
@Injectable()
export class AuthService {
  // ✅ 必须用 export 导出
  constructor(private prisma: PrismaService) {}

  async validateUser(username: string, password: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      console.log('❌ 用户不存在:', username);
      return null;
    }
    console.log('🔍 查到的用户:', user);
    console.log('🔑 输入的密码:', password);
    console.log('🔒 数据库存的密码:', user?.password);
    console.log('❓ 是 bcrypt 格式吗?', user?.password?.startsWith('$2'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (user && (await bcrypt.compare(password, user.password))) {
       // 生成真实 JWT
    const payload = { id: user.id, username: user.username };
    const accessToken = jwt.sign(payload, 'your-secret-key', { expiresIn: '1h' });
      return {
        ...user,
        accessToken: accessToken, // 实际项目应生成真实 JWT
      };
    }
    return null;
  }
}
