import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { ServerConfig } from '@src/config/server/server.type';
import { SERVER_CONFIG_TOKEN } from '@src/config/server/server.constant';
import { User } from '@src/entity/user.entity';

import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { jwtSecret, jwtExpiresIn } = configService.get<ServerConfig>(SERVER_CONFIG_TOKEN);

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: `${jwtExpiresIn}s`, // 단위: 초
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
