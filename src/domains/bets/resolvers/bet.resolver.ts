import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Bet } from '../models/bet.model';
import { BetService } from '../services/bet.service';

@Resolver(() => Bet)
export class BetResolver {
  constructor(private betService: BetService) {}

  @Query(() => [Bet])
  async getBetList(): Promise<Bet[]> {
    return this.betService.findAll();
  }

  @Query(() => Bet, { nullable: true })
  async getBet(@Args('id') id: number): Promise<Bet> {
    return this.betService.findById(id);
  }

  @Query(() => [Bet])
  async getBestBetPerUser(@Args('limit') limit: number): Promise<Bet[]> {
    return this.betService.getBestBetPerUser(limit);
  }

  @Mutation(() => Bet)
  async createBet(
    @Args('userId') userId: number,
    @Args('betAmount') betAmount: number,
    @Args('chance') chance: number,
  ): Promise<any> {
    return this.betService.createBet(userId, betAmount, chance);
  }
}
