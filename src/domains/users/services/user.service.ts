import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userModel.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async getBalance(id: number): Promise<number> {
    const { balance } = await this.userModel.findOne({
      attributes: ['balance'],
      where: {
        id,
      },
    });

    if (!balance) {
      throw new NotFoundException('User not found');
    }

    return balance;
  }
}
