// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
  });
