import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Bet } from './models/bet.model';
import { BetResolver } from './resolvers/bet.resolver';
import { BetService } from './services/bet.service';
import { UsersModule } from '../users/user.module';
import { RedisLockService } from '../redis/redis-lock.service';

@Module({
  imports: [SequelizeModule.forFeature([Bet]), UsersModule],
  providers: [BetService, BetResolver, RedisLockService],
})
export class BetsModule {}
