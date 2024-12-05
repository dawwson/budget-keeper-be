import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { AxiosError, AxiosResponse } from 'axios';

import { LoggerService } from '@src/logger/logger.service';
import { NotificationService } from '@src/notification/notification.service';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let httpService: HttpService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationService],
    })
      .useMocker(createMock)
      .compile();

    notificationService = module.get<NotificationService>(NotificationService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(notificationService).toBeDefined();
  });

  test('메시지 전송을 성공하면, info 레벨의 로그를 남긴다.', async () => {
    // given
    const postSpy = jest.spyOn(httpService.axiosRef, 'post').mockResolvedValue({ status: 204 });
    const logSpy = jest.spyOn(logger, 'log');

    // when
    await notificationService.reportError({
      method: 'GET',
      url: '/api/test',
      status: 500,
      timestamp: '2024-12-01T12:00:00Z',
      userId: 'user-123',
      trace: 'Stack trace details...',
      context: 'AllExceptionFilter',
    });

    // then
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  test('메시지 전송을 실패하면, warn 레벨의 로그를 남긴다.', async () => {
    // given
    const postSpy = jest
      .spyOn(httpService.axiosRef, 'post')
      .mockRejectedValue(
        new AxiosError('Request failed', null, null, null, { data: 'Error details' } as AxiosResponse),
      );
    const warnSpy = jest.spyOn(logger, 'warn');

    // when
    await notificationService.reportError({
      method: 'GET',
      url: '/api/test',
      status: 500,
      timestamp: '2024-12-01T12:00:00Z',
      userId: 'user-123',
      trace: 'Stack trace details...',
      context: 'AllExceptionFilter',
    });

    // then
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
