import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

import { RequestWithUser } from '../interface/request.interface';
import { LoggerService } from '../service/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new LoggerService('Request');

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
            this.logger.log({
              userId: user?.id || 'unidentified',
              method,
              url,
              status: statusCode,
              responseTime: `${Date.now() - startTime}ms`,
            });
          },
        }),
      );
  }
}
