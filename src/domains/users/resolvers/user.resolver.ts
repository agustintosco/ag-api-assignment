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
import { handleGraphQlError } from '../../utils/error-handler.util';
import { Bet } from '../../bets/models/bet.model';
import BetsLoaders from '../../bets/services/bet.loader';
import { UserList } from '../interfaces/user.interfaces';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private betsLoader: BetsLoaders,
  ) {}

  /**
   * Retrieves a single user by ID.
   * @param id - The ID of the user.
   * @returns The user object if found.
   * @throws {GraphQLError} if the user is not found (transformed from NotFoundException).
   */
  @Query(() => User)
  async getUser(@Args('id') id: number): Promise<User> {
    try {
      const user = await this.userService.findByIdOrFail(id);

      return user;
    } catch (error) {
      throw handleGraphQlError(error);
    }
  }

  /**
   * Retrieves a paginated list of users.
   * @param limit - The maximum number of users to return (default is 10).
   * @param offset - The number of users to skip for pagination (default is 0).
   * @returns An object containing:
   *   - `users`: The list of retrieved users.
   *   - `hasNextPage`: A boolean indicating if there is another page of users.
   * @throws {GraphQLError}
   */
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
      throw handleGraphQlError(error);
    }
  }

  /**
   * Resolves the list of bets associated with a specific user.
   * @param user - The parent user object
   * @returns A list of bets associated with the user.
   * @throws {GraphQLError}
   */
  @ResolveField(() => [Bet])
  async bets(@Parent() user: User): Promise<Bet[]> {
    try {
      return this.betsLoader.batchBets.load(user.id);
    } catch (error) {
      throw handleGraphQlError(error);
    }
  }
}
