import { ArgumentsHost, Catch, ExceptionFilter as NestExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

import { ErrorMessage } from '../constant/error-message.constant';
import { LoggerService } from '../../logger/logger.service';
import { RequestWithUser } from '../interface/request.interface';

// NOTE: 5XX 에러를 비즈니스 로직에서 임의로 발생시키지 않는다는 가정하에 해당 필터는 5XX 에러는 필터링 하지 않음.

@Catch(HttpException)
export class HttpExceptionFilter implements NestExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(HttpExceptionFilter.name);
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestWithUser>();
    const res = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const message = exception.message;

    const isDefinedError = Object.keys(ErrorMessage).includes(message);

    res.status(status).json({
      path: `${req.method} ${req.url}`,
      errorCode: isDefinedError ? message : 'UNDEFINED_ERROR',
      detail: isDefinedError ? ErrorMessage[message] : message,
      timestamp: new Date().toISOString(),
    });

    this.logger.warn(message, {
      method: req.method,
      url: req.url,
      userId: req?.user?.id || 'anonymous',
      status, //
    });
  }
}
