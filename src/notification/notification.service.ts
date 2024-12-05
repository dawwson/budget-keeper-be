import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';

import { SERVER_CONFIG_TOKEN } from '@src/config/server/server.constant';
import { ServerConfig } from '@src/config/server/server.type';
import { LoggerService } from '@src/logger/logger.service';

interface ErrorContent {
  method: string;
  url: string;
  status: number;
  timestamp: string;
  userId: string;
  trace: string;
  context: string;
}

@Injectable()
export class NotificationService {
  private webhookUrl: string;
  private readonly webhookName = '💰 차곡 서버 알림 💰';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(NotificationService.name);
    this.webhookUrl = this.configService.get<ServerConfig>(SERVER_CONFIG_TOKEN).webhookUrl;
  }

  async reportError(errorContent: ErrorContent) {
    // 메세지 내용 구성
    const message = {
      username: this.webhookName,
      content: '🚨 INTERNAL SERVER ERROR',
      embeds: [
        {
          title: '🔽 세부 내용',
          fields: [
            {
              name: '✔ Timestamp',
              value: errorContent.timestamp,
            },
            {
              name: '✔ Path',
              value: `${errorContent.method} ${errorContent.url}`,
            },

            {
              name: '✔ HTTP Status',
              value: errorContent.status,
            },
            {
              name: '✔ User ID',
              value: errorContent.userId,
            },
            {
              name: '✔ Logging Location',
              value: errorContent.context,
            },
            {
              name: '✔ Error Trace',
              value: errorContent.trace,
              inline: true,
            },
          ],
        },
      ],
    };

    // 메세지 전송
    try {
      await this.httpService.axiosRef.post(this.webhookUrl, message);

      this.logger.log('Error Notification is sent to the Discord channel.');
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.warn(error.message, error.response.data);
      }
    }
  }
}
