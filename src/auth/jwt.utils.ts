// // src/auth/jwt.utils.ts
// import * as jwt from 'jsonwebtoken';
// import * as dotenv from 'dotenv';
// import * as fs from 'fs';
// // 加载 .env.development 或 .env.production
// // 根据 NODE_ENV 决定是否加载 .env 文件
// const envFile =
//   process.env.NODE_ENV === 'development'
//     ? '.env.development'
//     : '.env.production';

// if (envFile && fs.existsSync(envFile)) {
//   dotenv.config({ path: envFile });
// } else {
//   console.warn(`⚠️ ${envFile} not found`);
// }
// const JWT_SECRET = process.env.JWT_SECRET;
// // if (!JWT_SECRET) {
// //   throw new Error('❌ JWT_SECRET is not defined in environment variables!');
// // }
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7天

// export const generateToken = (payload: object): string => {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
// };

// export const verifyToken = (token: string): any => {
//   // console.log('Token:', token); // 看有没有值
//   try {
//     return jwt.verify(token, JWT_SECRET);
//   } catch (error) {
//     return null;
//   }
// };
