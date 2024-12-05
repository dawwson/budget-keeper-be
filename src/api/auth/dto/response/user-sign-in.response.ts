import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { User } from '@src/entity/user.entity';

@Exclude()
export class UserSignInResponse {
  @Expose()
  id: string;

  @Expose()
  nickname: string;

  static from(user: User) {
    return plainToInstance(UserSignInResponse, user);
  }
}
