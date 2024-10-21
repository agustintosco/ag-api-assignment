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
import { handleError } from '../../utils/error-handler.util';
import { User } from 'src/domains/users/models/user.model';
import UserLoaders from 'src/domains/users/services/user.loader';
import { UserService } from 'src/domains/users/services/user.service';
import BetLoaders from '../services/bet.loader';

@Resolver(() => Bet)
export class BetResolver {
  constructor(
    private betService: BetService,
    private readonly userService: UserService,
    private readonly userLoader: UserLoaders,
    private readonly betLoaders: BetLoaders,
  ) {}

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
      throw handleError(error);
    }
  }

  @Query(() => Bet, { nullable: true })
  async getBet(@Args('id') id: number): Promise<Bet> {
    return this.betService.findByIdOrFail(id);
  }

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

  @Mutation(() => Bet)
  async createBet(
    @Args('userId') userId: number,
    @Args('betAmount') betAmount: number,
    @Args('chance') chance: number,
  ): Promise<any> {
    try {
      const bet = await this.betService.createBet(userId, betAmount, chance);

      return bet;
    } catch (error) {
      throw handleError(error);
    }
  }

  @ResolveField(() => User)
  async user(@Parent() bet: Bet): Promise<User> {
    try {
      return this.userLoader.batchUsers.load(bet.userId);
    } catch (error) {
      throw handleError(error);
    }
  }
}
