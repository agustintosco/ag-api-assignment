import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const sequelizeConfig: SequelizeModuleOptions = {
  dialect: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'agustin',
  database: process.env.DATABASE_NAME || 'postgres',
  autoLoadModels: true,
  synchronize: true,
};
