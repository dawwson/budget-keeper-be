import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    /**
     * - err : null | Error
     * - user : req.user | false
     */
    if (err || !user) {
      throw err || new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    return user;
  }
}
