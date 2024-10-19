import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import {
  ObjectType,
  Field,
  Int,
  Float,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { User } from 'src/domains/users/models/user.model';
import sequelize from 'sequelize';

@ObjectType()
@Table({
  tableName: 'bets',
  timestamps: true,
  underscored: true,
})
export class Bet extends Model {
  @Field(() => Int)
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Field(() => Int)
  @ForeignKey(() => User)
  @Column
  userId: number;

  @Field(() => Float)
  @Column({
    type: DataType.FLOAT,
  })
  betAmount: number;

  @Field(() => Float)
  @Column({
    type: DataType.FLOAT,
  })
  chance: number;

  @Field(() => Float)
  @Column({
    type: DataType.FLOAT,
  })
  payout: number;

  @Field(() => Boolean)
  @Column
  win: boolean;

  @Field(() => GraphQLISODateTime)
  @Column({
    type: DataType.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  })
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @Column({
    type: DataType.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  })
  updatedAt: Date;
}
