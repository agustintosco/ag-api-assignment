import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import sequelize from 'sequelize';

@Table({
  tableName: 'bets',
  underscored: true,
})
export class Bet extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column({
    type: DataType.FLOAT,
  })
  betAmount: number;

  @Column({
    type: DataType.FLOAT,
  })
  chance: number;

  @Column({
    type: DataType.FLOAT,
  })
  payout: number;

  @Column
  win: boolean;

  @Column({
    type: DataType.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  })
  updatedAt: Date;
}
