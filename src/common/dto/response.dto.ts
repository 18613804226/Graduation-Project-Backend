// src/common/dto/response.dto.ts
export class ApiResponse<T> {
  code: number;
  data: T;
  message: string;
  error: any;

  constructor(code: number, data: T, message = 'ok', error = null) {
    this.code = code;
    this.data = data;
    this.message = message;
    this.error = error;
  }
}

// 可选：提供快捷方法
export const success = <T>(data: T, message = 'ok') => 
  new ApiResponse(0, data, message);

export const fail = (message = 'error', error = null) => 
  new ApiResponse(1, null, message, error);