import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as winstonDaily from 'winston-daily-rotate-file';
import * as fs from 'fs';

import { NodeEnv, ServerConfig } from '@src/config/server/server.type';
import { SERVER_CONFIG_TOKEN } from '@src/config/server/server.constant';

// TODO: cls-rtracer로 request id를 넣어볼까?
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private env: NodeEnv;
  private logDir: string;
  private context: string;

  constructor(private readonly configService: ConfigService) {
    const { nodeEnv, logDir } = this.configService.get<ServerConfig>(SERVER_CONFIG_TOKEN);

    this.env = nodeEnv;
    this.logDir = logDir;

    if (nodeEnv !== NodeEnv.TEST && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.logger = this.createLogger();
  }

  setContext(context: string) {
    this.context = context;
  }

  private createLogger() {
    const { combine, timestamp, printf, colorize } = winston.format;

    const logger = winston.createLogger({
      level: 'info', // 기본 로그 레벨 설정
      format: combine(
        timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }), // ISO 8601 형식
        printf((info) => {
          const { timestamp, level, message, ...meta } = info;
          const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';

          return `${timestamp} APP[${this.context}]: ${level.toUpperCase()}: ${message}${metaString}`;
        }),
      ),
      transports: [
        // 로그 콘솔 출력
        new winston.transports.Console({
          format: combine(
            timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }), // ISO 8601 형식
            printf((info) => {
              const { timestamp, level, message, ...meta } = info;
              const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';

              return `${timestamp} [${this.context}]: ${level.toUpperCase()}: ${message}${metaString}`;
            }),
            colorize({ all: true }),
          ),
          silent: this.env !== NodeEnv.DEV, // dev 환경에서만 출력
        }),
      ],
    });

    // dev, prod 환경에서만 로그 파일 저장
    if (this.env !== NodeEnv.TEST) {
      logger.add(
        new winstonDaily({
          level: 'debug', // error, warn, info, debug
          datePattern: 'YYYY-MM-DD',
          dirname: this.logDir,
          filename: '%DATE%.log',
          maxSize: '20m', // 각 로그 파일의 최대 크기: 20MB
          maxFiles: '30d', // 30일 동안의 로그 파일만 유지
          zippedArchive: true, // maxSize 초과시 압축
        }),
      );
      logger.add(
        new winstonDaily({
          level: 'error', // error
          datePattern: 'YYYY-MM-DD',
          dirname: this.logDir + '/error',
          filename: '%DATE%.error.log',
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true,
        }),
      );
    }

    return logger;
  }

  // level 0 : error
  error(message: string, meta?: Record<string, any>): void {
    this.logger.error(message, meta);
  }

  // level 1 : warn
  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, meta);
  }

  // level 2 : info
  log(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, meta);
  }

  // level 5 : debug
  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, meta);
  }
}
