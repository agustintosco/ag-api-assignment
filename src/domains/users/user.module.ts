import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserService } from './services/user.service';
import { User } from './models/user.model';
import { UserResolver } from './resolvers/user.resolver';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UsersModule {}
