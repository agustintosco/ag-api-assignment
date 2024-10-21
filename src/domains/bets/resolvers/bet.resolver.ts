import {
  Resolver,
  Query,
  Args,
  Mutation,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { Bet } from '../models/bet.model';
import { BetService } from '../services/bet.service';
import { Connection } from '../../graphql/connection.dto';
import { handleGraphQlError } from '../../utils/error-handler.util';
import { User } from 'src/domains/users/models/user.model';
import UserLoaders from 'src/domains/users/services/user.loader';
import { UserService } from 'src/domains/users/services/user.service';
import BetLoaders from '../services/bet.loader';
import { GraphQLError } from 'graphql';

@Resolver(() => Bet)
export class BetResolver {
  constructor(
    private betService: BetService,
    private readonly userService: UserService,
    private readonly userLoader: UserLoaders,
    private readonly betLoaders: BetLoaders,
  ) {}

  /**
   * Retrieves a paginated list of bets using cursor-based pagination.
   * @param first - The maximum number of results to return.
   * @param after - The cursor for fetching results after a specific position (base64 encoded).
   * @returns A Connection object containing:
   *   - `edges`: An array of bets with their corresponding cursors.
   *   - `pageInfo`: Information about pagination, including whether there are more pages and the end cursor.
   * @throws {GraphQLError}
   */
  @Query(() => Connection)
  async getBetList(
    @Args('first', { type: () => Int, nullable: true }) first: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<Connection<Bet>> {
    try {
      const limit = first;
      const offset = after
        ? parseInt(Buffer.from(after, 'base64').toString('ascii'), 10)
        : 0;

      if (isNaN(offset)) {
        throw new GraphQLError('Invalid cursor', {
          extensions: {
            code: 'INVALID_CURSOR',
          },
        });
      }

      const bets = await this.betService.findAll({ limit, offset });

      const edges = bets.map((bet) => ({
        cursor: Buffer.from(String(bet.id)).toString('base64'),
        node: bet,
      }));

      const hasNextPage = bets.length === limit;
      const endCursor =
        edges.length > 0 ? edges[edges.length - 1].cursor : null;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor,
        },
      };
    } catch (error) {
      throw handleGraphQlError(error);
    }
  }

  /**
   * Retrieves a specific bet by its ID.
   * @param id - The ID of the bet.
   * @returns The Bet object if found, or null if the bet does not exist.
   * @throws {GraphQLError} if the bet is not found (transformed from NotFoundException).
   */
  @Query(() => Bet, { nullable: true })
  async getBet(@Args('id') id: number): Promise<Bet> {
    return this.betService.findByIdOrFail(id);
  }

  /**
   * Retrieves the best bet for each user, with an optional limit on the number of users.
   * @param limit - The maximum number of users to return (default is 10).
   * @returns An array of Bet objects representing the best bet for each user.
   */
  @Query(() => [Bet])
  async getBestBetPerUser(
    @Args('limit', { type: () => Number, nullable: true }) limit: number = 10,
  ) {
    const users = await this.userService.findAllWithBets({ limit, offset: 0 });
    const userIds = users.map((user) => user.id);

    const bestBets = await Promise.all(
      userIds.map((userId) => this.betLoaders.batchBestBets.load(userId)),
    );

    const filteredBestBets = bestBets.filter((bet) => bet !== null);
    return limit ? filteredBestBets.slice(0, limit) : filteredBestBets;
  }

  /**
   * Creates a new bet for a user.
   * @param userId - The ID of the user placing the bet.
   * @param betAmount - The amount of money being bet.
   * @param chance - The probability of winning, passed as a decimal (e.g., 0.5 for 50% chance).
   * @returns The created Bet object.
   * @throws {GraphQLError}
   */
  @Mutation(() => Bet)
  async createBet(
    @Args('userId') userId: number,
    @Args('betAmount') betAmount: number,
    @Args('chance') chance: number,
  ): Promise<Bet> {
    try {
      const bet = await this.betService.createBet(userId, betAmount, chance);

      return bet;
    } catch (error) {
      throw handleGraphQlError(error);
    }
  }

  /**
   * Resolves the user associated with a specific bet.
   * @param bet - The parent bet object containing the user ID.
   * @returns The User object associated with the bet.
   * @throws {GraphQLError}
   */
  @ResolveField(() => User)
  async user(@Parent() bet: Bet): Promise<User> {
    try {
      return this.userLoader.batchUsers.load(bet.userId);
    } catch (error) {
      throw handleGraphQlError(error);
    }
  }
}
