import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { Transaction } from 'sequelize';
import { Bet } from '../../bets/models/bet.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  /**
   * Finds a user by ID or throws a NotFoundException if the user is not found.
   * @param id - The ID of the user to retrieve.
   * @param transaction - An optional database transaction to use during the query.
   * @returns The User object if found.
   * @throws {NotFoundException} if the user is not found.
   */
  async findByIdOrFail(id: number, transaction?: Transaction): Promise<User> {
    const user = await this.userModel.findOne({
      where: { id },
      transaction,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Retrieves a paginated list of users.
   * @param limit - The maximum number of users to return.
   * @param offset - The number of users to skip for pagination.
   * @returns An array of User objects.
   */
  async findAll({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }): Promise<User[]> {
    return this.userModel.findAll({
      limit,
      offset,
    });
  }

  /**
   * Retrieves a paginated list of users who have at least one associated bet.
   * @param limit - The maximum number of users to return.
   * @param offset - The number of users to skip for pagination.
   * @returns An array of User objects, each including their associated bets.
   */
  async findAllWithBets({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }): Promise<User[]> {
    return this.userModel.findAll({
      limit,
      offset,
      include: [
        {
          model: Bet,
          required: true,
        },
      ],
    });
  }

  /**
   * Retrieves the balance of a specific user by their ID.
   * @param id - The ID of the user whose balance is to be retrieved.
   * @param transaction - An optional database transaction to use during the query.
   * @returns The balance of the user as a number.
   * @throws {NotFoundException} if the user is not found.
   */
  async getBalance(id: number, transaction?: Transaction): Promise<number> {
    const user = await this.userModel.findOne({
      attributes: ['balance'],
      where: { id },
      transaction,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.balance;
  }

  /**
   * Bulk creates multiple users in the database.
   * @param users - An array of user objects to create.
   * @returns An array of the created User objects.
   */
  async bulkCreate(users: Partial<User>[]): Promise<User[]> {
    return this.userModel.bulkCreate(users);
  }

  /**
   * Retrieves multiple users by their IDs.
   * @param ids - An array of user IDs to retrieve.
   * @returns An array of User objects matching the provided IDs.
   */
  async findByIds(ids: number[]): Promise<User[]> {
    return this.userModel.findAll({
      where: { id: ids },
    });
  }
}
