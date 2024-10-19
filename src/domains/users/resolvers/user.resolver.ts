import { Resolver, Query, Args } from '@nestjs/graphql';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => User)
  async getUser(@Args('id') id: number): Promise<User> {
    try {
      return this.userService.findById(id);
    } catch (error) {
      // log error
      throw error;
    }
  }

  @Query(() => [User])
  async getUserList(): Promise<User[]> {
    return this.userService.findAll();
  }
}
