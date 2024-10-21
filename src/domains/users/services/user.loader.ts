import * as DataLoader from 'dataloader';
import { Bet } from '../../bets/models/bet.model';
import { Injectable, Scope } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../models/user.model';

@Injectable({ scope: Scope.REQUEST })
export default class UserLoaders {
  constructor(private userService: UserService) {}

  public readonly batchUsers = new DataLoader(async (userIds: number[]) => {
    const users = await this.userService.findByIds(userIds);

    const userMap = users.reduce((acc, user) => {
      acc.set(user.id, user);
      return acc;
    }, new Map<number, User>());

    return userIds.map((userId) => userMap.get(userId) || null);
  });
}
