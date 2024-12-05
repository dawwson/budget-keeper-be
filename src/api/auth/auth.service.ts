import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@src/entity/user.entity';
import { ErrorCode } from '@src/shared/enum/error-code.enum';
import { comparePassword } from '@src/shared/util/encrypt.util';

import { UserVerifyInput } from './dto/input/user-verify.input';
import { UserDeleteInput } from './dto/input/user-delete.input';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createUser(user: User) {
    try {
      return await this.userRepo.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(ErrorCode.USER_EMAIL_IS_DUPLICATED);
      }
    }
  }

  async verifyUser(dto: UserVerifyInput): Promise<User> {
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException(ErrorCode.USER_EMAIL_DO_NOT_EXIST);
    }

    const isMatched = await comparePassword(dto.password, user.password);
    if (!isMatched) {
      throw new UnauthorizedException(ErrorCode.USER_PASSWORD_IS_WRONG);
    }

    return user;
  }

  async deleteUser(dto: UserDeleteInput) {
    const { userId, email } = dto;

    const user = await this.userRepo.findOneBy({ id: userId });
    if (user.email !== email) {
      throw new UnauthorizedException(ErrorCode.USER_EMAIL_DO_NOT_EXIST);
    }

    await this.userRepo.softDelete({ id: userId });

    return;
  }
}
