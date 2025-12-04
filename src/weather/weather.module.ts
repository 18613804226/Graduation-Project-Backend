// src/weather/weather.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    // 👇 直接调用 register，不需要导入 CacheModule
    CacheModule.register({
      ttl: 600, // 10分钟
      max: 100,
    }),
  ],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
