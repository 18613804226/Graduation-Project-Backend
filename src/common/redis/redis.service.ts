// src/common/redis/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

type CacheValue = { value: Buffer; expiresAt: number };

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;
  private memoryCache = new Map<string, CacheValue>();
  private useRedis = false;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          retryStrategy: (times) =>
            times < 5 ? Math.min(times * 50, 2000) : null,
        });

        this.client.on('error', (err) => {
          console.warn('[Redis] 连接失败，回退到内存缓存:', err.message);
          this.useRedis = false;
          this.client = null;
        });

        this.client.on('connect', () => {
          console.log('[Redis] 连接成功');
          this.useRedis = true;
        });
      } catch (err) {
        console.warn('[Redis] 初始化失败:', err.message);
        this.useRedis = false;
      }
    } else {
      console.log('[Redis] REDIS_URL 未设置，使用内存缓存');
    }
  }

  async set(key: string, value: Buffer, ttlSeconds = 3600): Promise<void> {
    if (this.useRedis && this.client) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      this.memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  async get(key: string): Promise<Buffer | null> {
    if (this.useRedis && this.client) {
      return await this.client.getBuffer(key);
    } else {
      // 清理过期（简单版）
      const now = Date.now();
      for (const [k, v] of this.memoryCache.entries()) {
        if (v.expiresAt < now) this.memoryCache.delete(k);
      }
      return this.memoryCache.get(key)?.value ?? null;
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.quit().catch(() => {});
    }
  }
}
