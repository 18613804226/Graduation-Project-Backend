// prisma/seed.ts
import 'dotenv/config'; // 确保能读取 .env 中的 DATABASE_URL
import { PrismaClient } from '@prisma/client'; // 如果你设置了 output，请改成对应路径
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// 创建 PostgreSQL 连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render 的 Postgres 有时需要显式启用 SSL（生产环境推荐）
  // 如果本地测试报 SSL 错误，可以注释掉下面这行
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

// 创建 Prisma Adapter
const adapter = new PrismaPg(pool);

// 传入 adapter 实例化 PrismaClient（关键！）
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 开始执行 seed 脚本...');

  // 检查 admin 是否存在
  const adminExists = await prisma.user.findFirst({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ 成功创建管理员用户: admin / 123456');
  } else {
    console.log('ℹ️ 管理员用户已存在，跳过创建');
  }

  console.log('✅ Seed 脚本执行完毕');
}

main()
  .catch((e) => {
    console.error('❌ Seed 执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // 重要：关闭连接池，避免进程挂起
    await pool.end();
  });
