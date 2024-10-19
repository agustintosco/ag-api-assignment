import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import {
  ObjectType,
  Field,
  Int,
  Float,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { Bet } from 'src/domains/bets/models/bet.model';
import sequelize from 'sequelize';

@ObjectType()
@Table({
  tableName: 'users',
  underscored: true,
})
export class User extends Model {
  @Field(() => Int)
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Field()
  @Column
  name: string;

  @Field(() => Float)
  @Column({ defaultValue: 0 })
  balance: number;

  @Field(() => [Bet])
  @HasMany(() => Bet)
  bets: Bet[];

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
