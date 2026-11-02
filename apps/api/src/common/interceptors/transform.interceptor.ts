import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((res) => {
        // Nếu response đã có cấu trúc enveloped hoặc res là null/primitive
        if (res && typeof res === 'object' && ('data' in res || 'meta' in res)) {
          return {
            success: true,
            statusCode,
            message: res.message || 'Thành công',
            data: res.data !== undefined ? res.data : res,
            meta: res.meta,
          };
        }

        return {
          success: true,
          statusCode,
          message: 'Thành công',
          data: res,
        };
      }),
    );
  }
}

