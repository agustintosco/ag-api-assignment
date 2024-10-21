import * as DataLoader from 'dataloader';
import { Bet } from '../../bets/models/bet.model';
import { Injectable, Scope } from '@nestjs/common';
import { BetService } from '../../bets/services/bet.service';

@Injectable({ scope: Scope.REQUEST })
export default class BetLoaders {
  constructor(private betService: BetService) {}

  public readonly batchBets = new DataLoader(async (userIds: number[]) => {
    const bets = await this.betService.findByUserIds(userIds);

    const betsMap = bets.reduce((acc, bet) => {
      if (!acc.has(bet.userId)) {
        acc.set(bet.userId, []);
      }
      acc.get(bet.userId)?.push(bet);
      return acc;
    }, new Map<number, Bet[]>());

    return userIds.map((userId) => betsMap.get(userId) || []);
  });

  public readonly batchBestBets = new DataLoader(async (userIds: number[]) => {
    const bestBets = await this.betService.findBestBetByUserIds(userIds);

    const betsMap = bestBets.reduce((acc, bet) => {
      acc.set(bet.userId, bet);
      return acc;
    }, new Map<number, Bet>());

    return userIds.map((userId) => betsMap.get(userId) || null);
  });
}
