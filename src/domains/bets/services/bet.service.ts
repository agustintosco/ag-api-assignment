import Big from 'big.js';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Bet } from '../models/bet.model';
import { UserService } from '../../users/services/user.service';
import sequelize, { Op, Transaction } from 'sequelize';
import { RedisLockService } from '../../shared/services/redis-lock.service';
import { Lock } from 'redlock';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class BetService {
  constructor(
    @InjectModel(Bet)
    private betModel: typeof Bet,
    @InjectConnection() private readonly sequelize: Sequelize,
    private userService: UserService,
    private readonly redisLockService: RedisLockService,
  ) {}

  async findAll({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }): Promise<Bet[]> {
    return this.betModel.findAll({
      limit,
      offset,
    });
  }

  async findByIdOrFail(id: number): Promise<Bet> {
    const bet = await this.betModel.findOne({
      where: { id },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with ID ${id} not found`);
    }
    return bet;
  }

  async findByUserIds(userIds: number[]): Promise<Bet[]> {
    return this.betModel.findAll({
      where: {
        userId: userIds,
      },
    });
  }

  async getBestBetPerUser(limit: number): Promise<Bet[]> {
    return this.betModel.findAll({
      attributes: [
        'userId',
        [sequelize.fn('MAX', sequelize.col('payout')), 'payout'],
      ],
      limit,
      group: ['userId'],
      order: [['payout', 'DESC']],
    });
  }

  async findBestBetByUserIds(
    userIds: number[],
    limit?: number,
  ): Promise<Bet[]> {
    const subquery = `
    SELECT MAX(payout) 
    FROM bets 
    WHERE bets.user_id = "Bet".user_id
  `;

    return await Bet.findAll({
      where: {
        userId: {
          [Op.in]: userIds,
        },
        payout: {
          [Op.eq]: Sequelize.literal(`(${subquery})`),
        },
      },
      limit,
    });
  }

  async createBet(
    userId: number,
    betAmount: number,
    chance: number,
  ): Promise<Bet> {
    const lockKey = `user-lock:${userId}`;
    const ttl = 5000;
    let lock: Lock;
    let transaction: Transaction;

    try {
      lock = await this.redisLockService.acquireLock(lockKey, ttl);
      transaction = await this.sequelize.transaction();

      const user = await this.userService.findByIdOrFail(userId, transaction);

      const balance = new Big(
        await this.userService.getBalance(userId, transaction),
      );
      const formattedBetAmount = new Big(betAmount);

      if (balance.lt(formattedBetAmount)) {
        throw new ConflictException('Insufficient balance');
      }

      user.balance = balance.minus(formattedBetAmount).toNumber();

      const win = Math.random() < chance;
      const payout = win ? formattedBetAmount.times(2) : new Big(0);

      if (win) {
        user.balance = new Big(user.balance).plus(payout).toNumber();
      }

      await user.save({ transaction });

      const bet = await this.betModel.create(
        {
          userId,
          betAmount: formattedBetAmount.toNumber(),
          chance,
          payout: payout.toNumber(),
          win,
        },
        { transaction },
      );

      await transaction.commit();

      return bet;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }

      throw error;
    } finally {
      if (lock) {
        await this.redisLockService.releaseLock(lock);
      }
    }
  }
}
