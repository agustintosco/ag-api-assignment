import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeConfig } from './config/sequelize.config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './domains/users/user.module';
import { BetsModule } from './domains/bets/bet.module';
import { SharedModule } from './domains/shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot(sequelizeConfig),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./src/domains/graphql/schema.graphql'],
      includeStacktraceInErrorResponses: false,
      formatError: (error) => {
        return {
          message: error.message,
          locations: error.locations,
          path: error.path,
          extensions: {
            code: error.extensions.code,
          },
        };
      },
    }),
    UsersModule,
    BetsModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
