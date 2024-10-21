import { Test, TestingModule } from '@nestjs/testing';
import { BetService } from './bet.service';
import { getModelToken } from '@nestjs/sequelize';
import { Bet } from '../models/bet.model';
import { UserService } from '../../users/services/user.service';
import { Sequelize } from 'sequelize-typescript';
import { RedisLockService } from '../../shared/services/redis-lock.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Lock } from 'redlock';
import sequelize from 'sequelize';

describe('BetService', () => {
  let service: BetService;
  let betModelMock: typeof Bet;
  let userServiceMock: UserService;
  let redisLockServiceMock: RedisLockService;

  const betLoadersMock = {
    batchBestBets: {
      load: jest.fn(),
    },
  };

  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetService,
        {
          provide: getModelToken(Bet),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findByIdOrFail: jest.fn(),
            getBalance: jest.fn(),
            findAllWithBets: jest.fn(),
          },
        },
        {
          provide: RedisLockService,
          useValue: {
            acquireLock: jest.fn(),
            releaseLock: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(() => mockTransaction),
          },
        },
      ],
    }).compile();

    service = module.get<BetService>(BetService);
    betModelMock = module.get<typeof Bet>(getModelToken(Bet));
    userServiceMock = module.get<UserService>(UserService);
    redisLockServiceMock = module.get<RedisLockService>(RedisLockService);
    jest.clearAllMocks();
  });

  describe('findByIdOrFail', () => {
    it('should return a bet when found', async () => {
      const bet = { id: 1, userId: 1, betAmount: 100, payout: 200 };
      (betModelMock.findOne as jest.Mock).mockResolvedValue(bet);

      const result = await service.findByIdOrFail(1);
      expect(result).toEqual(bet);
      expect(betModelMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if bet not found', async () => {
      (betModelMock.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findByIdOrFail(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated bets', async () => {
      const bets = [
        { id: 1, userId: 1, betAmount: 50, chance: 0.5, win: true },
      ];
      const limit = 10;
      const offset = 0;

      (betModelMock.findAll as jest.Mock).mockResolvedValue(bets);

      const result = await service.findAll({ limit, offset });

      expect(result).toEqual(bets);
      expect(betModelMock.findAll).toHaveBeenCalledWith({ limit, offset });
      expect(betModelMock.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBestBetPerUser', () => {
    it('should return the best bets for each user, filtering out null bets', async () => {
      const users = [
        { id: 1, name: 'User1' },
        { id: 2, name: 'User2' },
        { id: 3, name: 'User3' },
      ];
      const bestBets = [
        { id: 101, userId: 1, amount: 50 },
        { id: 102, userId: 2, amount: 100 },
        null,
      ];

      (userServiceMock.findAllWithBets as jest.Mock).mockResolvedValue(users);

      (betLoadersMock.batchBestBets.load as jest.Mock)
        .mockResolvedValueOnce(bestBets[0])
        .mockResolvedValueOnce(bestBets[1])
        .mockResolvedValueOnce(bestBets[2]);

      const userIds = users.map((user) => user.id);

      const result = await Promise.all(
        userIds.map((userId) => betLoadersMock.batchBestBets.load(userId)),
      );

      const filteredBestBets = result.filter((bet) => bet !== null);

      expect(filteredBestBets).toEqual([bestBets[0], bestBets[1]]);
    });
  });

  describe('createBet', () => {
    it('should create a bet when user has enough balance and lock is acquired', async () => {
      const user = { id: 1, balance: 200, save: jest.fn() };
      const bet = { id: 1, userId: 1, betAmount: 100, payout: 200, win: true };
      const lock = {} as Lock;

      (redisLockServiceMock.acquireLock as jest.Mock).mockResolvedValue(lock);
      (userServiceMock.findByIdOrFail as jest.Mock).mockResolvedValue(user);
      (userServiceMock.getBalance as jest.Mock).mockResolvedValue(200);
      (betModelMock.create as jest.Mock).mockResolvedValue(bet);

      const result = await service.createBet(1, 101, 0.55);

      expect(result).toEqual(bet);
      expect(redisLockServiceMock.acquireLock).toHaveBeenCalledWith(
        'user-lock:1',
        5000,
      );
      expect(userServiceMock.findByIdOrFail).toHaveBeenCalledWith(
        1,
        mockTransaction,
      );
      expect(userServiceMock.getBalance).toHaveBeenCalledWith(
        1,
        mockTransaction,
      );
      expect(betModelMock.create).toHaveBeenCalledWith(
        {
          userId: 1,
          betAmount: 101,
          chance: 0.55,
          payout: expect.any(Number),
          win: expect.any(Boolean),
        },
        { transaction: mockTransaction },
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(redisLockServiceMock.releaseLock).toHaveBeenCalledWith(lock);
    });

    it('should throw ConflictException if balance is insufficient', async () => {
      const user = { id: 1, balance: 20, save: jest.fn() };
      const lock = {} as Lock;

      (redisLockServiceMock.acquireLock as jest.Mock).mockResolvedValue(lock);
      (userServiceMock.findByIdOrFail as jest.Mock).mockResolvedValue(user);
      (userServiceMock.getBalance as jest.Mock).mockResolvedValue(50);

      await expect(service.createBet(1, 100, 0.5)).rejects.toThrow(
        ConflictException,
      );

      expect(redisLockServiceMock.releaseLock).toHaveBeenCalledWith(lock);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should release lock if an error occurs', async () => {
      const lock = {} as Lock;

      (redisLockServiceMock.acquireLock as jest.Mock).mockResolvedValue(lock);
      (userServiceMock.findByIdOrFail as jest.Mock).mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(service.createBet(1, 100, 0.5)).rejects.toThrow(Error);
      expect(redisLockServiceMock.releaseLock).toHaveBeenCalledWith(lock);
    });
  });
});
