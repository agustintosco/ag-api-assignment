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

  /**
   * Retrieves a paginated list of bets.
   * @param limit - The maximum number of bets to return.
   * @param offset - The number of bets to skip for pagination.
   * @returns An array of Bet objects.
   */
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

  /**
   * Retrieves a specific bet by its ID or throws a NotFoundException if the bet is not found.
   * @param id - The ID of the bet to retrieve.
   * @returns The Bet object if found.
   * @throws {NotFoundException} if the bet with the given ID is not found.
   */
  async findByIdOrFail(id: number): Promise<Bet> {
    const bet = await this.betModel.findOne({
      where: { id },
    });

    if (!bet) {
      throw new NotFoundException(`Bet with ID ${id} not found`);
    }
    return bet;
  }

  /**
   * Retrieves all bets associated with the specified user IDs.
   * @param userIds - An array of user IDs whose bets are to be retrieved.
   * @returns An array of Bet objects associated with the provided user IDs.
   */
  async findByUserIds(userIds: number[]): Promise<Bet[]> {
    return this.betModel.findAll({
      where: {
        userId: userIds,
      },
    });
  }

  /**
   * Retrieves the best bet (with the highest payout) for a list of specified user IDs.
   * @param userIds - An array of user IDs whose best bets are to be retrieved.
   * @returns An array of Bet objects representing the best bet for each specified user.
   */
  async findBestBetByUserIds(userIds: number[]): Promise<Bet[]> {
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
    });
  }

  /**
   * Creates a new bet for a user, handles locking and transactions and adjusts the user's balance.
   * @param userId - The ID of the user placing the bet.
   * @param betAmount - The amount of money being bet.
   * @param chance - The probability of winning, passed as a decimal (e.g. 0.5 for 50% chance).
   * @returns The created Bet object.
   * @throws {ConflictException} if the user has insufficient balance.
   * @throws {Error} for any other errors that occur during the process.
   */
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
