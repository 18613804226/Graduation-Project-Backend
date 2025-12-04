// src/weather/weather.controller.ts

import { Controller, Get, Query, BadRequestException } from '@nestjs/common'; // 👈 新增 BadRequestException
import { WeatherService } from './weather.service';
import { success } from 'src/common/dto/response.dto';

@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Get()
  async getWeather(
    @Query('city') city?: string,
    @Query('lat') lat?: string, // 👈 新增
    @Query('lon') lon?: string, // 👈 新增
  ) {
    let res;

    if (lat != null && lon != null) {
      // 如果提供了经纬度
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      // 简单校验
      if (
        isNaN(latitude) ||
        isNaN(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new BadRequestException('无效的经纬度');
      }

      res = await this.weatherService.getCurrentWeatherByCoords(
        latitude,
        longitude,
      );
    } else {
      // 否则用城市名（默认 Beijing）
      res = await this.weatherService.getCurrentWeather(city || 'Beijing');
    }

    return success(res);
  }
}
