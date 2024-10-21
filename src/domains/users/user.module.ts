import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserService } from './services/user.service';
import { User } from './models/user.model';
import { UserResolver } from './resolvers/user.resolver';
import { UserSeederService } from './services/user-seeder.service';
import { Bet } from '../bets/models/bet.model';
import BetLoaders from '../bets/services/bet.loader';
import { BetService } from '../bets/services/bet.service';
import { SharedModule } from '../shared/shared.module';
import UserLoaders from './services/user.loader';

@Module({
  imports: [SequelizeModule.forFeature([User, Bet]), SharedModule],
  providers: [
    UserService,
    UserResolver,
    UserSeederService,
    BetLoaders,
    BetService,
    UserLoaders,
  ],
})
export class UsersModule implements OnModuleInit {
  constructor(private readonly seederService: UserSeederService) {}

  async onModuleInit() {
    await this.seederService.seedUsers();
  }
}
