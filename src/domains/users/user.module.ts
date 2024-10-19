import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserService } from './services/user.service';
import { User } from './models/user.model';
import { UserResolver } from './resolvers/user.resolver';
import { UserSeederService } from './services/user-seeder.service';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UserService, UserResolver, UserSeederService],
  exports: [UserService],
})
export class UsersModule implements OnModuleInit {
  constructor(private readonly seederService: UserSeederService) {}

  async onModuleInit() {
    await this.seederService.seedUsers();
  }
}
