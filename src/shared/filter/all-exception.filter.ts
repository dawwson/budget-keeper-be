import { ArgumentsHost, Catch, ExceptionFilter as NestExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

import { LoggerService } from '../../logger/logger.service';
import { RequestWithUser } from '../interface/request.interface';
import { NotificationService } from '@src/notification/notification.service';

@Catch()
export class AllExceptionFilter implements NestExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly notificationService: NotificationService,
  ) {
    this.logger.setContext(AllExceptionFilter.name);
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestWithUser>();
    const res = ctx.getResponse<Response>();

    res.status(500).json({
      path: `${req.method} ${req.url}`,
      errorCode: 'INTERNAL_SERVER_ERROR',
      detail: exception.message,
      timestamp: new Date().toISOString(),
    });

    this.logger.error(exception.message, {
      method: req.method,
      url: req.url,
      userId: req?.user?.id || 'anonymous',
      status: res.status,
      trace: exception.stack,
    });

    this.notificationService.reportError({
      method: req.method,
      url: req.url,
      status: 500,
      timestamp: new Date().toISOString(),
      userId: req?.user?.id || 'anonymous',
      trace: exception.stack,
      context: AllExceptionFilter.name,
    });
  }
}
