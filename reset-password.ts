// reset-password.ts
import * as bcrypt from 'bcryptjs';

const password = '123456'; // 你想设置的密码
const hash = bcrypt.hashSync(password, 10);

console.log('✅ 为密码 "%s" 生成的 bcrypt 哈希是:', password);
console.log(hash);
console.log('\n👉 请复制上面这行哈希值，用于下一步更新数据库。');