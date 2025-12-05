// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
