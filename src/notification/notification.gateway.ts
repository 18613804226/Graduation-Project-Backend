// src/notification/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/notifications', // 命名空间，避免冲突
  cors: {
    origin: '*', // 生产环境改为你的域名
    credentials: true,
  },
})
@Injectable()
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  // ✅ 显式声明 userSocketMap 属性
  private userSocketMap = new Map<number, string[]>(); // 👈 这里必须有！
  // 用户注册（前端连接后发送）
  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = data.userId;
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, []);
    }
    this.userSocketMap.get(userId)!.push(client.id);
    client.data.userId = userId; // 存储用户 ID 到 socket

    this.logger.log(`User ${userId} registered`);
  }

  // 断开连接时清理
  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      const sockets = this.userSocketMap.get(userId) || [];
      const updated = sockets.filter((id) => id !== client.id);
      if (updated.length === 0) {
        this.userSocketMap.delete(userId);
      } else {
        this.userSocketMap.set(userId, updated);
      }
    }
  }

  // 👉 核心：向指定用户推送通知
  emitToUser(userId: number, event: string, data: any) {
    const socketIds = this.userSocketMap.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  // 用户映射表（内存中维护）
  private userSock;
}
