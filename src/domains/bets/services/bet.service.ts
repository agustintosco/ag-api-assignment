import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bet } from '../models/bet.model';
import { UserService } from '../../users/services/user.service';
import sequelize from 'sequelize';
import { RedisLockService } from '../../redis/redis-lock.service';
import { Lock } from 'redlock';

@Injectable()
export class BetService {
  constructor(
    @InjectModel(Bet)
    private betModel: typeof Bet,
    private userService: UserService,
    private readonly redisLockService: RedisLockService,
  ) {}

  findAll(): Promise<Bet[]> {
    return this.betModel.findAll();
  }

  async findById(id: number): Promise<Bet> {
    const bet = await this.betModel.findOne({
      where: { id },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with ID ${id} not found`);
    }
    return bet;
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

  async createBet(
    userId: number,
    betAmount: number,
    chance: number,
  ): Promise<Bet> {
    const lockKey = `user-lock:${userId}`;
    const ttl = 5000;

    let lock: Lock;

    try {
      lock = await this.redisLockService.acquireLock(lockKey, ttl);

      const user = await this.userService.findById(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const balance = await this.userService.getBalance(userId);

      if (balance < betAmount) {
        throw new ConflictException('Insufficient balance');
      }

      user.balance -= betAmount;
      // service for updating the user balance

      const win = Math.random() < chance;
      const payout = win ? betAmount * 2 : 0;
      // define the payout dynamically based on the chance

      if (win) {
        user.balance += payout;
        // service for updating the user balance
      }

      await user.save();

      const bet = await this.betModel.create({
        userId,
        betAmount,
        chance,
        payout,
        win,
      });

      return bet;
    } catch (error) {
      console.error('Failed to acquire lock or process bet:', error);
      throw error;
    } finally {
      if (lock) {
        await this.redisLockService.releaseLock(lock);
      }
    }
  }
}
