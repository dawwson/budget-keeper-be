import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Req, UseGuards } from '@nestjs/common';

import { LoggerService } from '@src/logger/logger.service';
import { JwtAuthGuard } from '@src/shared/guard/jwt-auth.guard';
import { RequestWithUser } from '@src/shared/interface/request.interface';

import { UserShowResponse } from './dto/response/user-show.response';
import { UserUpdateProfileRequest } from './dto/request/user-update-profile.request';
import { UserUpdateProfileResponse } from './dto/response/user-update-profile.response';
import { UserUpdatePasswordRequest } from './dto/request/user-update-password.request';
import { UserService } from './service/user.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(UserController.name);
  }

  @Get()
  async getUser(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const user = await this.userService.getUserById(userId);

    return UserShowResponse.from(user);
  }

  @Patch('profile')
  async updateUserProfile(@Req() req: RequestWithUser, @Body() dto: UserUpdateProfileRequest) {
    const userId = req.user.id;

    await this.userService.updateUserProfile({ userId, ...dto });

    const updatedUser = await this.userService.getUserById(userId);

    this.logger.log('User updated profile.', {
      ip: req.ip,
      userId: userId,
      before: req.user.nickname,
      after: dto.nickname,
    });

    return UserUpdateProfileResponse.from(updatedUser);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateUserPassword(@Req() req: RequestWithUser, @Body() dto: UserUpdatePasswordRequest) {
    const userId = req.user.id;

    await this.userService.updateUserPassword({ userId, ...dto });

    this.logger.log('User updated password', {
      ip: req.ip,
      userId: userId,
    });

    return;
  }
}
