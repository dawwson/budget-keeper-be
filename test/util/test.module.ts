import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import SnakeNamingStrategy from 'typeorm-naming-strategy';
import * as path from 'path';

import { AuthModule } from '@src/api/auth/auth.module';
import { BudgetModule } from '@src/api/budget/budget.module';
import { CategoryModule } from '@src/api/category/category.module';
import { StatModule } from '@src/api/stat/stat.module';
import { TxModule } from '@src/api/tx/tx.module';
import { UserModule } from '@src/api/user/user.module';
import { LoggerModule } from '@src/logger/logger.module';
import { NotificationModule } from '@src/notification/notification.module';

import dbConfig from '@src/config/db/db.config';
import { DbConfig } from '@src/config/db/db.type';
import { DB_CONFIG_TOKEN } from '@src/config/db/db.constant';
import serverConfig from '@src/config/server/server.config';

import { AllExceptionFilter } from '@src/shared/filter/all-exception.filter';
import { HttpExceptionFilter } from '@src/shared/filter/http-exception.filter';
import { TransformInterceptor } from '@src/shared/interceptor/transform.interceptor';
import { LoggingInterceptor } from '@src/shared/interceptor/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.test'],
      load: [dbConfig, serverConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DbConfig>(DB_CONFIG_TOKEN);

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          synchronize: true,
          entities: [path.join(__dirname, '/../../src/**/*.entity{.ts,.js}')],
          namingStrategy: new SnakeNamingStrategy(),
          // logging: true,
        };
      },
    }),
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
export class TestModule {}
