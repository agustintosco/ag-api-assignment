import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Bet } from '../../bets/models/bet.model';
import sequelize from 'sequelize';

@Table({
  tableName: 'users',
  underscored: true,
})
export class User extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column
  name: string;

  @Column({ defaultValue: 0, type: DataType.FLOAT })
  balance: number;

  @HasMany(() => Bet)
  bets?: Bet[];

  @Column({
    type: DataType.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  })
  createdAt?: Date;

  @Column({
    type: DataType.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  })
  updatedAt?: Date;
}
