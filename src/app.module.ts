import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import SnakeNamingStrategy from 'typeorm-naming-strategy';
import * as path from 'path';

import { AuthModule } from './api/auth/auth.module';
import { BudgetModule } from './api/budget/budget.module';
import { CategoryModule } from './api/category/category.module';
import { StatModule } from './api/stat/stat.module';
import { TxModule } from './api/tx/tx.module';
import { UserModule } from './api/user/user.module';
import { BatchModule } from './batch/batch.module';
import { LoggerModule } from './logger/logger.module';
import { NotificationModule } from './notification/notification.module';

import dbConfig from './config/db/db.config';
import { DbConfig } from './config/db/db.type';
import { DB_CONFIG_TOKEN } from './config/db/db.constant';
import serverConfig from './config/server/server.config';
import { NodeEnv, ServerConfig } from './config/server/server.type';
import { SERVER_CONFIG_TOKEN } from './config/server/server.constant';

import { AllExceptionFilter } from './shared/filter/all-exception.filter';
import { HttpExceptionFilter } from './shared/filter/http-exception.filter';
import { TransformInterceptor } from './shared/interceptor/transform.interceptor';
import { LoggingInterceptor } from './shared/interceptor/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      load: [dbConfig, serverConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const serverConfig = configService.get<ServerConfig>(SERVER_CONFIG_TOKEN);
        const dbConfig = configService.get<DbConfig>(DB_CONFIG_TOKEN);

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          synchronize: serverConfig.nodeEnv === NodeEnv.DEV,
          entities: [path.join(__dirname, '/entity/*.entity{.ts,.js}')],
          logging: serverConfig.nodeEnv === NodeEnv.DEV,
          namingStrategy: new SnakeNamingStrategy(),
          // FIXME: RDS DB 접근 시 ssl 인증을 요구함.
          //        개발 단계에서는 ssl 검증을 생략할 수 있으나, 프로덕션 단계에서는 인증서를 쓰는 게 좋다.
          // ssl: { rejectUnauthorized: false },
        };
      },
    }),
    BatchModule,
    LoggerModule,
    NotificationModule,
    // === API 모듈 ===
    AuthModule,
    BudgetModule,
    CategoryModule,
    StatModule,
    TxModule,
    UserModule,
  ],
  providers: [
    // === Interceptor ===
    {
      // 실행 순서 : 1
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      // 실행 순서 : 2
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // === Pipe ===
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true, // DTO 클래스로 자동 형변환
          whitelist: true, // DTO 클래스에 없는 속성 제거
        }),
    },
    // === Filter ===
    {
      // 실행 순서 : 2
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      // 실행 순서 : 1
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
