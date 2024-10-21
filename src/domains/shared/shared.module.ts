import { Module } from '@nestjs/common';
import { RedisLockService } from './services/redis-lock.service';

@Module({
  providers: [RedisLockService],
  exports: [RedisLockService],
})
export class SharedModule {}
