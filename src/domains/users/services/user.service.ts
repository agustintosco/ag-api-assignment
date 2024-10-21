import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { Transaction } from 'sequelize';
import { Bet } from 'src/domains/bets/models/bet.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

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

  async bulkCreate(users: Partial<User>[]): Promise<User[]> {
    return this.userModel.bulkCreate(users);
  }

  async findByIds(ids: number[]): Promise<User[]> {
    return this.userModel.findAll({
      where: { id: ids },
    });
  }
}
