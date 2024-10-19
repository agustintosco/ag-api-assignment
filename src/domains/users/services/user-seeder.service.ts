import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../models/user.model';

@Injectable()
export class UserSeederService {
  constructor(private readonly userService: UserService) {}

  async seedUsers(): Promise<void> {
    const users = await this.userService.findAll();

    if (users.length === 0) {
      const users: Partial<User>[] = [
        { name: 'Agustin', balance: 50 },
        { name: 'Tomas', balance: 10 },
        { name: 'Angela', balance: 100 },
      ];

      await this.userService.bulkCreate(users);
    }
  }
}
