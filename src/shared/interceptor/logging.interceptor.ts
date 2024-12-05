import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

import { RequestWithUser } from '../interface/request.interface';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // pre-controller
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, user } = request;
    const { statusCode } = response;
    const startTime = Date.now();

    // post-controller
    return next
      .handle() // route handler 실행 후 반환된 값을 observable로 매핑함
      .pipe(
        tap({
          next: () => {
            this.logger.log('Request completed.', {
              method,
              url,
              userId: user?.id || 'anonymous',
              status: statusCode,
              responseTime: `${Date.now() - startTime}ms`,
            });
          },
        }),
      );
  }
}
