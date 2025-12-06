// src/weather/weather.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

type WeatherData = {
  city: string;
  temp: number | string;
  feels_like?: number | string;
  humidity?: number;
  pressure?: number;
  description: string;
  icon: string;
  // 新增但不破坏：min/max
  temp_min?: number | string;
  temp_max?: number | string;
};

@Injectable()
export class WeatherService {
  private readonly API_KEY: string;
  private readonly BASE_URL = 'https://api.weatherapi.com/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
  ) {
    this.API_KEY = this.configService.get<string>('WEATHERAPI_KEY')!;
  }

  /** 保持方法名：实时 + 当天 min/max（城市名） */
  async getCurrentWeather(city: string = 'Beijing'): Promise<WeatherData> {
    const cacheKey = `weather_${city}`;
    const cached = await this.cacheManager.get<WeatherData>(cacheKey);
    if (cached) return cached;

    try {
      const [currentRes, forecastRes]: any = await Promise.all([
        firstValueFrom(
          this.httpService.get(`${this.BASE_URL}/current.json`, {
            params: { key: this.API_KEY, q: city, lang: 'en' },
          }),
        ),
        firstValueFrom(
          this.httpService.get(`${this.BASE_URL}/forecast.json`, {
            params: { key: this.API_KEY, q: city, days: 1, lang: 'en' },
          }),
        ),
      ]);

      const today = forecastRes.data?.forecast?.forecastday?.[0];

      const data: WeatherData = {
        city: currentRes.data.location.name,
        temp: Math.round(currentRes.data.current.temp_c),
        feels_like: Math.round(currentRes.data.current.feelslike_c),
        humidity: currentRes.data.current.humidity,
        pressure: currentRes.data.current.pressure_mb,
        description: currentRes.data.current.condition.text,
        icon: currentRes.data.current.condition.icon,
        temp_min: today ? Math.round(today.day.mintemp_c) : '--',
        temp_max: today ? Math.round(today.day.maxtemp_c) : '--',
      };

      await this.cacheManager.set(cacheKey, data, 600);
      return data;
    } catch (error) {
      console.error('WeatherAPI error:', error.response?.data || error.message);
      return {
        city,
        temp: '--',
        description: 'Failed to retrieve',
        icon: '',
        temp_min: '--',
        temp_max: '--',
      };
    }
  }

  /** 保持方法名：实时 + 当天 min/max（经纬度） */
  async getCurrentWeatherByCoords(
    lat: number,
    lon: number,
  ): Promise<WeatherData> {
    const cacheKey = `weather_coords_${lat}_${lon}`;
    const cached = await this.cacheManager.get<WeatherData>(cacheKey);
    if (cached) return cached;

    try {
      const q = `${lat},${lon}`;
      const [currentRes, forecastRes]: any = await Promise.all([
        firstValueFrom(
          this.httpService.get(`${this.BASE_URL}/current.json`, {
            params: { key: this.API_KEY, q, lang: 'en' },
          }),
        ),
        firstValueFrom(
          this.httpService.get(`${this.BASE_URL}/forecast.json`, {
            params: { key: this.API_KEY, q, days: 1, lang: 'en' },
          }),
        ),
      ]);

      const today = forecastRes.data?.forecast?.forecastday?.[0];

      const data: WeatherData = {
        city: currentRes.data.location.name,
        temp: Math.round(currentRes.data.current.temp_c),
        feels_like: Math.round(currentRes.data.current.feelslike_c),
        humidity: currentRes.data.current.humidity,
        pressure: currentRes.data.current.pressure_mb,
        description: currentRes.data.current.condition.text,
        icon: currentRes.data.current.condition.icon,
        temp_min: today ? Math.round(today.day.mintemp_c) : '--',
        temp_max: today ? Math.round(today.day.maxtemp_c) : '--',
      };

      await this.cacheManager.set(cacheKey, data, 600);
      return data;
    } catch (error) {
      console.error(
        'WeatherAPI error (by coords):',
        error.response?.data || error.message,
      );
      return {
        city: 'Unknown location',
        temp: '--',
        description: 'Failed to retrieve',
        icon: '',
        temp_min: '--',
        temp_max: '--',
      };
    }
  }
}
