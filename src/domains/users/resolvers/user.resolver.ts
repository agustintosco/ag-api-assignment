import {
  Resolver,
  Query,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { handleError } from '../../utils/error-handler.util';
import { Bet } from '../../bets/models/bet.model';
import BetsLoaders from '../../bets/services/bet.loader';
import { UserList } from '../interfaces/user.interfaces';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private betsLoader: BetsLoaders,
  ) {}

  @Query(() => User)
  async getUser(@Args('id') id: number): Promise<User> {
    try {
      const user = await this.userService.findByIdOrFail(id);

      return user;
    } catch (error) {
      throw handleError(error);
    }
  }

  @Query(() => UserList)
  async getUserList(
    @Args('limit', { type: () => Int, nullable: true }) limit: number = 10,
    @Args('offset', { type: () => Int, nullable: true }) offset: number = 0,
  ): Promise<{ users: User[]; hasNextPage: boolean }> {
    try {
      const users = await this.userService.findAll({ limit, offset });

      const hasNextPage = users.length === limit;

      return {
        users,
        hasNextPage,
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  @ResolveField(() => [Bet])
  async bets(@Parent() user: User): Promise<Bet[]> {
    try {
      return this.betsLoader.batchBets.load(user.id);
    } catch (error) {
      throw handleError(error);
    }
  }
}
