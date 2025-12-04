// src/weather/weather.service.ts
import { Injectable, Inject, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
@Injectable()
export class WeatherService {
  private readonly API_KEY: any;
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject('CACHE_MANAGER') private cacheManager: Cache, // 👈 字符串注入
  ) {
    this.API_KEY = this.configService.get<string>('OPENWEATHER_API_KEY');
  }

  async getCurrentWeather(city: string = 'Beijing') {
    const cacheKey = `weather_${city}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const response: any = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/weather`, {
          params: {
            q: city,
            appid: this.API_KEY,
            units: 'metric',
            lang: 'zh_En',
          },
        }),
      );
      const data = {
        city: response.data.name,
        temp: Math.round(response.data.main.temp),
        feels_like: Math.round(response.data.main.feels_like),
        temp_min: Math.round(response.data.main.temp_min),
        temp_max: Math.round(response.data.main.temp_max),
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
      };

      await this.cacheManager.set(cacheKey, data, 600);
      return data;
    } catch (error) {
      console.error(
        'OpenWeatherMap error:',
        error.response?.data || error.message,
      );
      return {
        city,
        temp: '--',
        description: 'Failed to retrieve',
        icon: '01d',
      };
    }
  }

  // 👇 在 getCurrentWeather 方法下面添加这个新方法
  async getCurrentWeatherByCoords(lat: number, lon: number) {
    const cacheKey = `weather_coords_${lat}_${lon}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const response: any = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/weather`, {
          params: {
            lat,
            lon,
            appid: this.API_KEY,
            units: 'metric',
            lang: 'zh_en', // 👈 建议改成 zh_cn，中文描述
          },
        }),
      );

      const data = {
        city: response.data.name,
        temp: Math.round(response.data.main.temp),
        feels_like: Math.round(response.data.main.feels_like),
        temp_min: Math.round(response.data.main.temp_min),
        temp_max: Math.round(response.data.main.temp_max),
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
      };

      await this.cacheManager.set(cacheKey, data, 600); // 缓存 10 分钟
      return data;
    } catch (error) {
      console.error(
        'OpenWeatherMap error (by coords):',
        error.response?.data || error.message,
      );
      return {
        city: 'Unknown location',
        temp: '--',
        description: 'Failed to retrieve',
        icon: '01d',
      };
    }
  }
}
