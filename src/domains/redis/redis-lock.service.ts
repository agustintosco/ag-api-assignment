import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedisLockService implements OnModuleInit {
  private redisClient: Redis;
  private redlock: Redlock;

  onModuleInit() {
    this.redisClient = new Redis();

    this.redlock = new Redlock([this.redisClient], {
      retryCount: 2,
      retryDelay: 100,
      retryJitter: 50,
    });
  }

  async acquireLock(lockKey: string, ttl: number): Promise<Lock> {
    try {
      return await this.redlock.acquire([lockKey], ttl);
    } catch (error) {
      throw new Error(`Failed to acquire lock on ${lockKey}: ${error.message}`);
    }
  }

  async releaseLock(lock: Lock): Promise<void> {
    try {
      await lock.release();
    } catch (error) {
      console.error(`Failed to release lock: ${error.message}`);
    }
  }
}
