import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Bet } from './models/bet.model';
import { BetResolver } from './resolvers/bet.resolver';
import { BetService } from './services/bet.service';
import { User } from '../users/models/user.model';
import { SharedModule } from '../shared/shared.module';
import BetLoaders from './services/bet.loader';
import { UserService } from '../users/services/user.service';
import UserLoaders from '../users/services/user.loader';

@Module({
  imports: [SequelizeModule.forFeature([Bet, User]), SharedModule],
  providers: [BetService, BetResolver, BetLoaders, UserService, UserLoaders],
})
export class BetsModule {}
